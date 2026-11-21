import { createSlice, nextId, resetAll, useDerived, useStoreVersion, bump } from "./_core";
import { audit, auditDenied } from "./_audit";
import { applyTariff, getSettings } from "./_settings";
import { cutEligibility, markNotice, scheduleSlot } from "./_cutpolicy";
import { can, createApproval, currentUser, decideApproval, requiresFourEyes, type Approval } from "./_permissions";
import { advanceCut, cancelInvoice, clearCutStage, recordPayment, resolveDispute as resolveInvoiceDispute } from "./_data-finans";
import { addCustomer, addHistory, findCustomer, metersFor, patchCustomer } from "./_data-musteri";
import { assignOutageCrew, closeOutage, createOutage, effectiveOutages, patchMeter } from "./_ops";
import {
  APPLICATIONS,
  APPLICATION_STAGES,
  CALLS,
  CONSENTS,
  CREDITS,
  DATA_REQUESTS,
  DISPUTES,
  LEAKS,
  LEAK_STAGES,
  PRODUCERS,
  STOCK,
  type Application,
  type ApplicationKind,
  type ApplicationStage,
  type Call,
  type CallKind,
  type Consent,
  type ConsentKind,
  type Credit,
  type CreditSource,
  type DataRequest,
  type DataRequestKind,
  type Dispute,
  type DisputeKind,
  type LeakCase,
  type LeakStage,
  type Producer,
  type StockMeter,
  type StockStatus,
} from "./_data-yeni";
import { NOTICES, SUBSTATIONS, SUPPLIERS, TODAY, TODAY_KEY, TRANSFORMERS, WORK_ORDERS, addDays, dayKey, type Customer, type Meter, type WorkOrderType } from "./_data";

/**
 * Portal'ının TEK deposu: ortak bayrak, yeni varlıklar ve bütün sayfa
 * eylemleri burada. Kaynak dilimler:
 *   - `_data-finans.ts`  faturalar, ödemeler, planlar, mutabakat, kesme aşamaları
 *   - `_data-musteri.ts` müşteri yamaları, notlar, geçmiş, yeni müşteri/sayaç
 *   - `_ops.ts`          okuma, sayaç ve arıza yamaları
 *   - `_settings.ts`     tarife ve fatura parametreleri
 *   - `_cutpolicy.ts`    kesme politikası ve ihtar tarihleri
 *   - `_permissions.ts`  oturum, rol, yetki matrisi, iki göz onayı
 *   - `_audit.ts`        denetim izi
 *   - bu dosya           iş emirleri, başvurular, kaçak, stok, çağrı, itiraz, alacak, üretici, KVKK, bildirim
 * Hepsi `_core.ts` içindeki TEK yayın kanalına bağlıdır: herhangi bir dilim
 * değişince bütün türetilmiş değerler (`_selectors.ts`) aynı anda güncellenir.
 *
 * Her mutasyon `audit()` ile denetim izine yazılır; yetkisiz deneme işlem YAPMAZ,
 * yalnız reddedildiği kaydedilir.
 */

export { bump, nextId, resetAll, useDerived, useStoreVersion };

/* ======================================================================== */
/* BİLDİRİMLER                                                               */
/* ======================================================================== */

export type Notification = { id: string; title: string; body?: string; at: Date; read: boolean; tone: "info" | "success" | "warning" };
const notifications = createSlice<readonly Notification[]>(NOTICES.map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.at, read: false, tone: "info" as const })));
export const useNotifications = () => notifications.use();
export const getNotifications = () => notifications.get();
let noteClock = 0;
export function pushNotification(title: string, body?: string, tone: Notification["tone"] = "info") {
  notifications.set((list) => [{ id: nextId("bn-"), title, body, at: new Date(2026, 10, 21, 10, 40 + ++noteClock), read: false, tone }, ...list]);
}
export const markNotificationsRead = (ids: readonly string[]) => notifications.set((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));

/* ======================================================================== */
/* İŞ EMİRLERİ                                                               */
/* ======================================================================== */

export type WorkType = WorkOrderType | "sokum" | "kesif" | "montaj" | "ariza";
export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  kesme: "Enerji Kesme",
  baglama: "Yeniden Bağlama",
  "sayac-degisim": "Sayaç Değişimi",
  sokum: "Sayaç Söküm",
  "okuma-turu": "Saha Okuma Turu",
  kontrol: "Kaçak Kontrolü",
  kesif: "Keşif",
  montaj: "Montaj",
  ariza: "Arıza Onarımı",
};
export type WorkStatus = "acik" | "atandi" | "yolda" | "sahada" | "tamamlandi" | "iptal";
export const WORK_STATUS_LABEL: Record<WorkStatus, string> = { acik: "Açık", atandi: "Atandı", yolda: "Yolda", sahada: "Sahada", tamamlandi: "Tamamlandı", iptal: "İptal" };
export const WORK_FLOW: readonly WorkStatus[] = ["acik", "atandi", "yolda", "sahada", "tamamlandi"];
export type WorkResult = { oldSerial?: string; oldIndex?: number; newSerial?: string; newIndex?: number; seal?: string; note?: string };
export type WorkOrderX = {
  id: string;
  type: WorkType;
  status: WorkStatus;
  customerId: string | null;
  meterId: string | null;
  regionId: string;
  scheduled: Date;
  createdAt: Date;
  assignee: string | null;
  reason: string;
  /** Bağlı kayıt: arıza, vaka, başvuru, itiraz. */
  linkedId: string | null;
  /** Hedef süre (saat). */
  slaHours: number;
  result?: WorkResult;
  history: readonly { at: Date; status: WorkStatus; by: string }[];
};

const SLA_BY_TYPE: Record<WorkType, number> = { kesme: 72, baglama: 24, "sayac-degisim": 120, sokum: 120, "okuma-turu": 72, kontrol: 120, kesif: 120, montaj: 120, ariza: 4 };

const workOrders = createSlice<readonly WorkOrderX[]>(
  WORK_ORDERS.map((w, i) => {
    // Tohum dağılımı: planlı işlerin bir kısmı atanmış, yolda ya da sahada (kanban dolu görünsün).
    const planned = w.status === "planlandi";
    const stage: WorkStatus = !planned ? (w.status === "tamamlandi" ? "tamamlandi" : "iptal") : (["acik", "acik", "atandi", "atandi", "yolda", "sahada", "acik"] as const)[i % 7];
    const crew = ["Ekip A (Merkez)", "Ekip B (Kıyı)", "Ekip C (Vadi)", "Ekip D (Ova)", "Ekip E (Yayla)", "Ekip F (Sanayi)"][i % 6];
    return {
    id: w.id,
    type: w.type,
    status: stage,
    customerId: w.customerId,
    meterId: null,
    regionId: w.regionId,
    scheduled: w.scheduled,
    createdAt: addDays(w.scheduled, -2),
    assignee: stage === "acik" || stage === "iptal" ? null : crew,
    reason: w.reason,
    linkedId: null,
    slaHours: SLA_BY_TYPE[w.type],
    history: [{ at: addDays(w.scheduled, -2), status: "acik" as const, by: "Sistem" }, ...(stage === "acik" ? [] : [{ at: addDays(w.scheduled, -1), status: stage, by: "Sistem" }])],
    };
  }),
);
export const useWorkOrders = () => workOrders.use();
export const getWorkOrders = () => workOrders.get();

export type NewWorkOrder = { type: WorkType; customerId?: string | null; meterId?: string | null; regionId?: string; scheduled?: Date; reason: string; linkedId?: string | null; assignee?: string | null; slaHours?: number };

/** İş emri oluşturur. Planlı zaman verilmezse iş günü ve mesaiye oturur. */
export function createWorkOrder(input: NewWorkOrder): WorkOrderX {
  const c = input.customerId ? findCustomer(input.customerId) : undefined;
  const wo: WorkOrderX = {
    id: nextId("IE-", 3500),
    type: input.type,
    status: input.assignee ? "atandi" : "acik",
    customerId: input.customerId ?? null,
    meterId: input.meterId ?? null,
    regionId: input.regionId ?? c?.regionId ?? "merkez",
    scheduled: input.scheduled ?? scheduleSlot(),
    createdAt: TODAY,
    assignee: input.assignee ?? null,
    reason: input.reason,
    linkedId: input.linkedId ?? null,
    slaHours: input.slaHours ?? SLA_BY_TYPE[input.type],
    history: [{ at: TODAY, status: input.assignee ? "atandi" : "acik", by: currentUser().name }],
  };
  workOrders.set((l) => [wo, ...l]);
  audit("İş emri oluşturdu", `${wo.id} · ${WORK_TYPE_LABEL[wo.type]}`, undefined, wo.reason);
  return wo;
}

const patchWork = (id: string, patch: (w: WorkOrderX) => WorkOrderX) => workOrders.set((l) => l.map((w) => (w.id === id ? patch(w) : w)));
let workClock = 0;

export function assignWorkOrder(id: string, assignee: string) {
  patchWork(id, (w) => ({ ...w, assignee, status: w.status === "acik" ? "atandi" : w.status, history: [...w.history, { at: new Date(2026, 10, 21, 10, 40 + ++workClock), status: "atandi", by: currentUser().name }] }));
  audit("İş emrini atadı", id, undefined, assignee);
}

/** Durum makinesinde bir adım ilerler; tamamlanınca yan etkiler (müşteri durumu, röle, stok) işler. */
export function advanceWorkOrder(id: string, result?: WorkResult) {
  const w = workOrders.get().find((x) => x.id === id);
  if (!w || w.status === "tamamlandi" || w.status === "iptal") return;
  const next = WORK_FLOW[Math.min(WORK_FLOW.indexOf(w.status) + 1, WORK_FLOW.length - 1)];
  patchWork(id, (x) => ({ ...x, status: next, result: result ?? x.result, history: [...x.history, { at: new Date(2026, 10, 21, 10, 40 + ++workClock), status: next, by: currentUser().name }] }));
  audit("İş emrini ilerletti", id, WORK_STATUS_LABEL[w.status], WORK_STATUS_LABEL[next]);
  if (next === "tamamlandi") completeWorkOrder({ ...w, status: next, result: result ?? w.result });
}
export function cancelWorkOrder(id: string, reason?: string) {
  const w = workOrders.get().find((x) => x.id === id);
  if (!w || w.status === "tamamlandi") return;
  patchWork(id, (x) => ({ ...x, status: "iptal", history: [...x.history, { at: new Date(2026, 10, 21, 10, 40 + ++workClock), status: "iptal", by: currentUser().name }] }));
  if (w.customerId && (w.type === "kesme" || w.type === "baglama")) patchCustomer(w.customerId, { pendingWork: null }, { title: `${WORK_TYPE_LABEL[w.type]} emri iptal edildi`, description: reason, tone: "neutral" });
  audit("İş emrini iptal etti", id, WORK_STATUS_LABEL[w.status], reason ?? "İptal");
}

function completeWorkOrder(w: WorkOrderX) {
  const meterId = w.meterId ?? (w.customerId ? findMeterId(w.customerId) : null);
  if (w.type === "kesme" && w.customerId) {
    patchCustomer(w.customerId, { status: "kesik", pendingWork: null }, { title: "Enerji kesildi", description: `İş emri ${w.id}`, tone: "danger" });
    if (meterId) patchMeter(meterId, { relay: "kesik" });
    advanceCut([w.customerId], "kesildi");
  } else if (w.type === "baglama" && w.customerId) {
    patchCustomer(w.customerId, { status: "aktif", pendingWork: null }, { title: "Enerji yeniden bağlandı", description: `İş emri ${w.id}`, tone: "success" });
    if (meterId) patchMeter(meterId, { relay: "acik" });
    clearCutStage(w.customerId);
  } else if (w.type === "sayac-degisim" && meterId) {
    patchMeter(meterId, { replacedBy: w.result?.newSerial }, "Sayaç değiştirdi", `${w.result?.oldSerial ?? meterId} → ${w.result?.newSerial ?? "yeni sayaç"}`);
    if (w.result?.newSerial) setStockStatusBySerial(w.result.newSerial, "tahsisli", w.customerId);
    if (w.result?.oldSerial) setStockStatusBySerial(w.result.oldSerial, "sokulmus", null);
  }
}
const findMeterId = (customerId: string): string | null => metersFor(customerId)[0]?.id ?? null;

/* ======================================================================== */
/* KESME VE BAĞLAMA (tek yol)                                                */
/* ======================================================================== */

export type CutResult =
  | { ok: true; status: "olusturuldu"; workOrder: WorkOrderX }
  | { ok: true; status: "onay-bekliyor"; approval: Approval }
  | { ok: false; status: "engelli" | "yetki"; blockers: string[] };

/** Yazılı ihtar: tarihi kayıtlı; kesme emri bunun üzerine bekleme süresi geçince verilebilir. */
export function sendNotice(customerId: string): boolean {
  if (!can("kesme")) {
    auditDenied("İhtar gönderdi", customerId);
    return false;
  }
  markNotice(customerId);
  advanceCut([customerId], "ihtar");
  patchCustomer(customerId, {}, { title: "Yazılı ihtar gönderildi", description: "Bekleme süresi başladı", tone: "warning" });
  return true;
}

function createCutOrder(customerId: string, reason: string): WorkOrderX {
  const wo = createWorkOrder({ type: "kesme", customerId, reason, slaHours: 72 });
  patchCustomer(customerId, { pendingWork: { id: wo.id, kind: "kesme", reason, date: dayKey(wo.scheduled) } }, { title: "Kesme emri verildi", description: `${wo.id} · ${dayKey(wo.scheduled)}`, tone: "warning" });
  advanceCut([customerId], "kesme-emri");
  return wo;
}

/** Kesme emri: yetki, politika (ihtar, bekleme, hassas abone, itiraz, plan) ve iki göz onayı denetlenir. */
export function requestCut(customerId: string, reason: string): CutResult {
  if (!can("kesme")) {
    auditDenied("Kesme emri verdi", customerId);
    return { ok: false, status: "yetki", blockers: ["Kesme emri yetkiniz yok"] };
  }
  const e = cutEligibility(customerId);
  if (!e.eligible) {
    audit("Kesme emri reddedildi (politika)", customerId, undefined, e.blockers.join("; "), false);
    return { ok: false, status: "engelli", blockers: e.blockers };
  }
  if (requiresFourEyes("kesme")) {
    const approval = createApproval({ kind: "kesme", target: customerId, summary: `${findCustomer(customerId)?.name ?? customerId}: ${reason}`, payload: { customerId, reason } });
    audit("Kesme onayı istedi", customerId, undefined, approval.id);
    return { ok: true, status: "onay-bekliyor", approval };
  }
  return { ok: true, status: "olusturuldu", workOrder: createCutOrder(customerId, reason) };
}

/** Yeniden bağlama: SLA sayaçlı iş emri; ödeme/plan sonrası verilir. */
export function requestReconnect(customerId: string, reason: string): WorkOrderX | null {
  if (!can("kesme")) {
    auditDenied("Bağlama emri verdi", customerId);
    return null;
  }
  const wo = createWorkOrder({ type: "baglama", customerId, reason, slaHours: 24, scheduled: scheduleSlot(TODAY_KEY, 9) });
  patchCustomer(customerId, { pendingWork: { id: wo.id, kind: "baglama", reason, date: dayKey(wo.scheduled) } }, { title: "Bağlama emri verildi", description: wo.id, tone: "primary" });
  advanceCut([customerId], "baglama-emri");
  return wo;
}

/* ======================================================================== */
/* AYARLAR: tarife, iki göz onayı                                            */
/* ======================================================================== */

export type GuardedResult = { ok: true; status: "uygulandi" } | { ok: true; status: "onay-bekliyor"; approval: Approval } | { ok: false; status: "yetki" };

export function updateTariff(id: string, value: number, effective: string): GuardedResult {
  const row = getSettings().tariffs.find((t) => t.id === id);
  if (!row) return { ok: false, status: "yetki" };
  if (!can("tarife")) {
    auditDenied("Tarife güncelledi", row.label);
    return { ok: false, status: "yetki" };
  }
  if (requiresFourEyes("tarife")) {
    const approval = createApproval({ kind: "tarife", target: id, summary: `${row.label}: ${row.value} → ${value} (${effective})`, payload: { id, value, effective } });
    audit("Tarife onayı istedi", row.label, String(row.value), String(value));
    return { ok: true, status: "onay-bekliyor", approval };
  }
  applyTariff(id, value, effective, currentUser().name);
  audit("Tarife güncelledi", row.label, String(row.value), String(value));
  return { ok: true, status: "uygulandi" };
}

export function requestInvoiceCancel(invoiceId: string, rebill: boolean): GuardedResult {
  if (!can("fatura")) {
    auditDenied("Fatura iptal etti", invoiceId);
    return { ok: false, status: "yetki" };
  }
  if (requiresFourEyes("fatura-iptal")) {
    const approval = createApproval({ kind: "fatura-iptal", target: invoiceId, summary: `${invoiceId} iptal${rebill ? " ve düzeltme faturası" : ""}`, payload: { invoiceId, rebill } });
    audit("Fatura iptal onayı istedi", invoiceId, undefined, approval.id);
    return { ok: true, status: "onay-bekliyor", approval };
  }
  cancelInvoice(invoiceId, rebill);
  return { ok: true, status: "uygulandi" };
}

/** Onayı karara bağlar; onaylanırsa bekleyen işlemi çalıştırır. */
export function decide(id: string, ok: boolean, reason?: string) {
  const r = decideApproval(id, ok, reason);
  if (!r.ok) {
    audit("Onay kararı reddedildi", id, undefined, r.reason, false);
    return r;
  }
  audit(ok ? "Onay verdi" : "Onayı reddetti", id, r.approval.summary, reason);
  if (ok) {
    const p = r.approval.payload;
    if (r.approval.kind === "kesme") createCutOrder(String(p.customerId), String(p.reason));
    else if (r.approval.kind === "fatura-iptal") cancelInvoice(String(p.invoiceId), Boolean(p.rebill));
    else if (r.approval.kind === "tarife") applyTariff(String(p.id), Number(p.value), String(p.effective), r.approval.requestedBy);
  }
  return r;
}

/* ======================================================================== */
/* BAŞVURULAR                                                                */
/* ======================================================================== */

const applications = createSlice<readonly Application[]>(APPLICATIONS);
export const useApplications = () => applications.use();
export const getApplications = () => applications.get();
const patchApplication = (id: string, patch: (a: Application) => Application) => applications.set((l) => l.map((a) => (a.id === id ? patch(a) : a)));

export type NewApplication = { kind: ApplicationKind; applicant: string; regionId: string; district: string; address: string; powerKw: number; voltage: "AG" | "OG" };
export function createApplication(input: NewApplication): Application {
  const a: Application = {
    ...input,
    id: nextId("BAS-26", 30),
    stage: "basvuru",
    createdAt: TODAY_KEY,
    stageSince: TODAY_KEY,
    docs: ["Kimlik ya da vergi levhası", "Tapu ya da kira sözleşmesi", "Mimari/elektrik projesi", "İskan ya da yapı ruhsatı", "Vekâletname (varsa)"].map((label, i) => ({ id: `d${i}`, label, ok: false })),
    connectionFee: (input.powerKw * (input.voltage === "OG" ? 690 : 410) + 18_000) * 100,
    deposit: Math.round(input.powerKw * 6_000),
    feePaid: false,
    assignedTo: currentUser().name,
    meterSerial: null,
  };
  applications.set((l) => [a, ...l]);
  audit("Başvuru aldı", a.id, undefined, `${a.applicant} · ${a.powerKw} kW`);
  return a;
}
export function toggleApplicationDoc(id: string, docId: string) {
  patchApplication(id, (a) => ({ ...a, docs: a.docs.map((d) => (d.id === docId ? { ...d, ok: !d.ok } : d)) }));
  audit("Başvuru evrakını güncelledi", id, undefined, docId);
}
export function payApplicationFee(id: string) {
  patchApplication(id, (a) => ({ ...a, feePaid: true }));
  audit("Bağlantı bedelini tahsil etti", id);
}
export function rejectApplication(id: string, reason: string) {
  patchApplication(id, (a) => ({ ...a, stage: "red", note: reason, stageSince: TODAY_KEY }));
  audit("Başvuruyu reddetti", id, undefined, reason);
}

export type StageGate = { ok: true } | { ok: false; reason: string };
/** Aşama kapıları: evrak tamam olmadan keşif, bedel tahsil edilmeden montaj, sayaç tahsis edilmeden enerjilendirme olmaz. */
export function applicationGate(a: Application): StageGate {
  if (a.stage === "evrak" && !a.docs.every((d) => d.ok)) return { ok: false, reason: "Eksik evrak var" };
  if (a.stage === "bedel" && !a.feePaid) return { ok: false, reason: "Bağlantı bedeli tahsil edilmedi" };
  if (a.stage === "montaj" && !a.meterSerial) return { ok: false, reason: "Sayaç tahsis edilmedi" };
  if (a.stage === "red" || a.stage === "tamam") return { ok: false, reason: "Başvuru kapandı" };
  return { ok: true };
}
export function advanceApplication(id: string): StageGate {
  const a = applications.get().find((x) => x.id === id);
  if (!a) return { ok: false, reason: "Başvuru bulunamadı" };
  const gate = applicationGate(a);
  if (!gate.ok) return gate;
  const order = APPLICATION_STAGES.map((s) => s.id);
  const next = order[Math.min(order.indexOf(a.stage as (typeof order)[number]) + 1, order.length - 1)] as ApplicationStage;
  if (next === "tamam") {
    energizeApplication(a);
    return { ok: true };
  }
  patchApplication(id, (x) => ({ ...x, stage: next, stageSince: TODAY_KEY }));
  if (next === "kesif") createWorkOrder({ type: "kesif", regionId: a.regionId, reason: `${a.id} keşfi`, linkedId: a.id });
  if (next === "montaj") createWorkOrder({ type: "montaj", regionId: a.regionId, reason: `${a.id} sayaç montajı`, linkedId: a.id });
  audit("Başvuruyu ilerletti", id, a.stage, next);
  return { ok: true };
}
/** Enerjilendirme: abonelik açılır (müşteri + sayaç oluşur), tahsisli stok sayaç ona bağlanır. */
function energizeApplication(a: Application) {
  const tr = TRANSFORMERS.find((t) => t.regionId === a.regionId) ?? TRANSFORMERS[0];
  const sub = SUBSTATIONS.find((s) => s.id === tr.substationId) ?? SUBSTATIONS[0];
  const custNo = 20_000 + applications.get().findIndex((x) => x.id === a.id) * 7;
  const c: Customer = {
    id: `C-${custNo}`,
    name: a.applicant,
    kind: a.voltage === "OG" ? "sanayi" : "bireysel",
    voltage: a.voltage,
    free: false,
    supplierId: SUPPLIERS[0].id,
    regionId: a.regionId,
    district: a.district,
    address: a.address,
    installation: `1${String(7_000_000 + custNo * 3)}`,
    taxMasked: "•••••••••001",
    phone: "05•• ••• •• ••",
    email: "yeni•••@example.com",
    status: "aktif",
    since: TODAY_KEY,
    baseKwh: 220,
    tariff: "tek-zamanli",
    autoPay: false,
    annualKwh: 2640,
    contractKw: a.powerKw,
  };
  const serial = a.meterSerial ?? `KZA-26-${custNo}`;
  const m: Meter = {
    id: `M-${custNo}`,
    serial,
    model: STOCK.find((s) => s.serial === serial)?.model ?? "Akıllı Sayaç AS-310",
    customerId: c.id,
    substationId: sub.id,
    comm: "ami",
    status: "okunuyor",
    multiplier: 1,
    ct: "—",
    vt: "—",
    ctRatio: 1,
    vtRatio: 1,
    transformerId: tr.id,
    multiZone: false,
    installed: TODAY_KEY,
    lastSeen: TODAY,
    readDay: 10,
    firmware: "v3.0.2",
    base: { t1: 0, t2: 0, t3: 0 },
  };
  addCustomer(c, m);
  setStockStatusBySerial(serial, "tahsisli", c.id);
  patchApplication(a.id, (x) => ({ ...x, stage: "tamam", stageSince: TODAY_KEY, note: `Abonelik açıldı: ${c.id}` }));
  addHistory(c.id, { title: "Başvuruyla açıldı", description: a.id, tone: "success" });
  audit("Enerjilendirdi, abonelik açtı", a.id, undefined, `${c.id} · ${serial}`);
}

/* ======================================================================== */
/* SAYAÇ STOKU                                                               */
/* ======================================================================== */

const stock = createSlice<readonly StockMeter[]>(STOCK);
export const useStock = () => stock.use();
export const getStock = () => stock.get();
const patchStock = (id: string, patch: Partial<StockMeter>) => stock.set((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));

function setStockStatusBySerial(serial: string, status: StockStatus, allocatedTo: string | null) {
  stock.set((l) => (l.some((s) => s.serial === serial) ? l.map((s) => (s.serial === serial ? { ...s, status, allocatedTo } : s)) : l));
}
/** Başvuru montajı için stoktan sayaç tahsis eder (mühürle). */
export function allocateStock(stockId: string, target: { applicationId?: string; customerId?: string }) {
  const s = stock.get().find((x) => x.id === stockId);
  if (!s || s.status !== "stokta") return false;
  patchStock(stockId, { status: "tahsisli", allocatedTo: target.customerId ?? target.applicationId ?? null, seal: `M-${String(100_000 + stock.get().filter((x) => x.seal).length * 37)}` });
  if (target.applicationId) patchApplication(target.applicationId, (a) => ({ ...a, meterSerial: s.serial }));
  audit("Sayaç tahsis etti", s.serial, "Stokta", target.applicationId ?? target.customerId);
  return true;
}
export function receiveStock(stockId: string) {
  patchStock(stockId, { status: "stokta", allocatedTo: null, seal: null, note: undefined });
  audit("Sökülen sayacı depoya aldı", stockId);
}
export function sendToInspection(ids: readonly string[]) {
  stock.set((l) => l.map((s) => (ids.includes(s.id) ? { ...s, status: "muayenede" as const } : s)));
  audit("Sayaçları muayeneye gönderdi", `${ids.length} sayaç`);
}
export function returnFromInspection(ids: readonly string[], ok: boolean) {
  stock.set((l) => l.map((s) => (ids.includes(s.id) ? { ...s, status: ok ? ("stokta" as const) : ("hurda" as const), inspectionDue: ok ? dayKey(addDays(TODAY, 3650)) : s.inspectionDue } : s)));
  audit(ok ? "Muayeneden geri aldı" : "Muayene sonrası hurdaya ayırdı", `${ids.length} sayaç`);
}

/* ======================================================================== */
/* KAÇAK VAKALARI                                                            */
/* ======================================================================== */

const leaks = createSlice<readonly LeakCase[]>(LEAKS);
export const useLeaks = () => leaks.use();
export const getLeaks = () => leaks.get();
const patchLeak = (id: string, patch: Partial<LeakCase>) => leaks.set((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

export function createLeak(meterId: string, customerId: string, flag: string, source: LeakCase["source"] = "okuma"): LeakCase {
  const c = findCustomer(customerId);
  const months = 3;
  const kwh = Math.round((c?.baseKwh ?? 300) * 0.6 * months);
  const leak: LeakCase = { id: nextId("KC-26", 30), meterId, customerId, source, flag, openedAt: TODAY_KEY, stage: "supheli", estimatedKwh: kwh, months, amount: Math.round(kwh * 3.1 * 1.3 * 1.2 * 100), tutanakNo: null, assignedTo: currentUser().name, workOrderId: null, disputeId: null };
  leaks.set((l) => [leak, ...l]);
  audit("Kaçak vakası açtı", leak.id, undefined, flag);
  return leak;
}
export function advanceLeak(id: string): boolean {
  const l = leaks.get().find((x) => x.id === id);
  if (!l) return false;
  const order = LEAK_STAGES.map((s) => s.id);
  const next = order[Math.min(order.indexOf(l.stage) + 1, order.length - 1)] as LeakStage;
  if (next === l.stage) return false;
  const patch: Partial<LeakCase> = { stage: next };
  if (next === "kontrol") patch.workOrderId = createWorkOrder({ type: "kontrol", customerId: l.customerId, meterId: l.meterId, reason: `${l.id}: ${l.flag}`, linkedId: l.id }).id;
  if (next === "tutanak") patch.tutanakNo = `TT-2026-${String(400 + leaks.get().length)}`;
  patchLeak(id, patch);
  audit("Kaçak vakasını ilerletti", id, l.stage, next);
  return true;
}
export function setLeakAmount(id: string, kwh: number, months: number) {
  patchLeak(id, { estimatedKwh: kwh, months, amount: Math.round(kwh * 3.1 * 1.3 * 1.2 * 100) });
  audit("Kaçak bedelini hesapladı", id, undefined, `${kwh} kWh · ${months} ay`);
}

/* ======================================================================== */
/* ÇAĞRI MERKEZİ                                                             */
/* ======================================================================== */

const calls = createSlice<readonly Call[]>(CALLS);
export const useCalls = () => calls.use();
export const getCalls = () => calls.get();
let callClock = 0;
export function createCall(input: { kind: CallKind; customerId: string | null; channel?: Call["channel"]; note: string; priority?: Call["priority"] }): Call {
  const m = input.customerId ? metersFor(input.customerId)[0] : undefined;
  const call: Call = {
    id: nextId("CG-26", 1400),
    at: new Date(2026, 10, 21, 10, 40 + ++callClock),
    channel: input.channel ?? "telefon",
    kind: input.kind,
    customerId: input.customerId,
    meterId: m?.id ?? null,
    transformerId: m?.transformerId ?? null,
    priority: input.priority ?? (input.kind === "ariza" ? "yuksek" : "normal"),
    status: "acik",
    assignee: currentUser().name,
    slaMinutes: input.kind === "ariza" ? 120 : 1440,
    outageId: null,
    note: input.note,
  };
  calls.set((l) => [call, ...l]);
  audit("Çağrı kaydı açtı", call.id, undefined, `${input.kind} · ${input.customerId ?? "kimliksiz"}`);
  return call;
}
export function setCallStatus(id: string, status: Call["status"], rating?: number) {
  calls.set((l) => l.map((c) => (c.id === id ? { ...c, status, rating: rating ?? c.rating } : c)));
  audit("Çağrı durumunu değiştirdi", id, undefined, status);
}
export function linkCallToOutage(callId: string, outageId: string) {
  calls.set((l) => l.map((c) => (c.id === callId ? { ...c, outageId, status: "islemde" as const } : c)));
  audit("Çağrıyı arızaya bağladı", callId, undefined, outageId);
}
/** Aynı DTR'ye gelen açık arıza çağrılarını tek arıza kaydına çevirir (arıza adayı). */
export function createOutageFromCalls(transformerId: string) {
  const tr = TRANSFORMERS.find((t) => t.id === transformerId);
  const open = calls.get().filter((c) => c.transformerId === transformerId && c.kind === "ariza" && c.status === "acik" && !c.outageId);
  if (!tr || !open.length) return null;
  const crew = ["Ekip A (Merkez)", "Ekip B (Kıyı)", "Ekip C (Vadi)", "Ekip D (Ova)", "Ekip E (Yayla)", "Ekip F (Sanayi)"][["merkez", "kiyi", "vadi", "ova", "yayla", "sanayi"].indexOf(tr.regionId)] ?? "Ekip A (Merkez)";
  const o = createOutage({ kind: "plansiz", substationId: tr.substationId, regionId: tr.regionId, feederId: tr.feederId, transformerIds: [tr.id], start: new Date(2026, 10, 21, 9, 0), end: null, cause: "Çağrı kümesinden arıza adayı", crew });
  open.forEach((c) => linkCallToOutage(c.id, o.id));
  assignOutageCrew(o.id, crew);
  createWorkOrder({ type: "ariza", regionId: tr.regionId, reason: `${o.id} onarımı`, linkedId: o.id, assignee: crew, slaHours: 4 });
  return o;
}

/* ======================================================================== */
/* ÜRETİCİLER                                                                */
/* ======================================================================== */

const producers = createSlice<readonly Producer[]>(PRODUCERS);
export const useProducers = () => producers.use();
export const getProducers = () => producers.get();
export function advanceProducer(id: string) {
  producers.set((l) => l.map((p) => (p.id !== id ? p : p.status === "basvuru" ? { ...p, status: "kabul" as const, acceptedAt: TODAY_KEY } : p.status === "kabul" ? { ...p, status: "devrede" as const } : p)));
  audit("Üretici başvurusunu ilerletti", id);
}
export const settleProducerCredit = (id: string, kwh: number) => {
  producers.set((l) => l.map((p) => (p.id === id ? { ...p, creditKwh: Math.max(0, p.creditKwh - kwh) } : p)));
  audit("Üretici alacağını mahsup etti", id, undefined, `${kwh} kWh`);
};

/* ======================================================================== */
/* İTİRAZLAR VE ALACAKLAR                                                    */
/* ======================================================================== */

const disputes = createSlice<readonly Dispute[]>(DISPUTES);
export const useDisputes = () => disputes.use();
export const getDisputes = () => disputes.get();
export function createDispute(input: { kind: DisputeKind; subjectId: string; customerId: string; reason: string; meterTest?: boolean }): Dispute {
  const d: Dispute = { id: nextId("IT-26", 30), ...input, meterTest: Boolean(input.meterTest), openedAt: TODAY_KEY, dueAt: dayKey(addDays(TODAY, 15)), status: "acik", decision: null, assignedTo: currentUser().name };
  disputes.set((l) => [d, ...l]);
  audit("İtiraz kaydı açtı", d.id, undefined, `${input.kind} · ${input.reason}`);
  return d;
}
export function advanceDispute(id: string) {
  disputes.set((l) => l.map((d) => (d.id !== id ? d : d.status === "acik" ? { ...d, status: "inceleme" as const } : d.status === "inceleme" ? { ...d, status: "karar" as const } : d)));
  audit("İtirazı ilerletti", id);
}
export function decideDispute(id: string, decision: "kabul" | "red" | "kismi") {
  const d = disputes.get().find((x) => x.id === id);
  if (!d) return;
  disputes.set((l) => l.map((x) => (x.id === id ? { ...x, status: "kapandi" as const, decision } : x)));
  if (d.kind === "fatura") resolveInvoiceDispute(d.subjectId, decision === "red" ? "red" : "kabul");
  audit("İtiraz kararı verdi", id, d.status, decision);
}

const credits = createSlice<readonly Credit[]>(CREDITS);
export const useCredits = () => credits.use();
export const getCredits = () => credits.get();
export function createCredit(customerId: string, source: CreditSource, amount: number): Credit {
  const c: Credit = { id: nextId("AL-26", 30), customerId, source, amount, createdAt: TODAY_KEY, status: "acik" };
  credits.set((l) => [c, ...l]);
  audit("Alacak kaydı açtı", c.id, undefined, `${amount / 100} TL`);
  return c;
}
/** Alacağı bir faturaya mahsup eder: fatura anaparası azalır (tahsilat gibi işlenir, kanal "banka", referans MAHSUP). */
export function applyCredit(id: string, invoiceId: string) {
  const c = credits.get().find((x) => x.id === id);
  if (!c || c.status !== "acik") return;
  recordPayment(invoiceId, { channel: "banka", amount: c.amount, reference: `MAHSUP-${id}` });
  credits.set((l) => l.map((x) => (x.id === id ? { ...x, status: "mahsup" as const, note: invoiceId } : x)));
  audit("Alacağı mahsup etti", id, undefined, invoiceId);
}
export function refundCredit(id: string) {
  credits.set((l) => l.map((x) => (x.id === id ? { ...x, status: "iade" as const } : x)));
  audit("Alacağı iade etti", id);
}

/* ======================================================================== */
/* KVKK                                                                      */
/* ======================================================================== */

const consents = createSlice<readonly Consent[]>(CONSENTS);
export const useConsents = () => consents.use();
export const getConsents = () => consents.get();
export function setConsent(customerId: string, kind: ConsentKind, given: boolean) {
  consents.set((l) => (l.some((c) => c.customerId === customerId && c.kind === kind) ? l.map((c) => (c.customerId === customerId && c.kind === kind ? { ...c, given, at: TODAY_KEY } : c)) : [{ id: nextId("RZ-"), customerId, kind, given, at: TODAY_KEY, channel: "web" as const }, ...l]));
  audit("Rıza tercihini güncelledi", customerId, undefined, `${kind}: ${given ? "verdi" : "geri aldı"}`);
}
const dataRequests = createSlice<readonly DataRequest[]>(DATA_REQUESTS);
export const useDataRequests = () => dataRequests.use();
export const getDataRequests = () => dataRequests.get();
export function createDataRequest(customerId: string, kind: DataRequestKind): DataRequest {
  const r: DataRequest = { id: nextId("VT-26", 30), customerId, kind, openedAt: TODAY_KEY, dueAt: dayKey(addDays(TODAY, 30)), status: "acik" };
  dataRequests.set((l) => [r, ...l]);
  audit("Veri talebi açtı", r.id, undefined, kind);
  return r;
}
export function advanceDataRequest(id: string) {
  dataRequests.set((l) => l.map((r) => (r.id !== id ? r : r.status === "acik" ? { ...r, status: "isleniyor" as const } : r.status === "isleniyor" ? { ...r, status: "tamam" as const } : r)));
  audit("Veri talebini ilerletti", id);
}

/** Maskeli alanı gerekçeyle görüntüleme: erişim kaydı düşer. */
export function revealMasked(customerId: string, field: string, reason: string) {
  audit("Maskeli alanı görüntüledi", `${customerId} · ${field}`, undefined, reason);
}

export const getSettingsSnapshot = () => getSettings();

/** Bütün Portal durumunu başlangıca döndürür (doğrulayıcı ve testler). */
export { effectiveOutages, closeOutage };
export const resetStore = resetAll;
