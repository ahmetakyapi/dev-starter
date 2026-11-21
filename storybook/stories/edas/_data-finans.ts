import { createSlice } from "./_core";
import { computeInvoice, deriveStatus, lateInterest } from "./_billing";
import { getBillingParams, getLateRates } from "./_settings";
import { effectiveReadings } from "./_ops";
import { audit } from "./_audit";
import {
  CUSTOMERS,
  CURRENT_PERIOD,
  INVOICES,
  PAYMENTS,
  PAYMENT_PLANS,
  PERIODS_12,
  READINGS,
  TODAY,
  TODAY_KEY,
  addDays,
  balanceOf,
  customer,
  dayKey,
  daysBetween,
  parseDay,
  supplier,
  type Invoice,
  type InvoiceStatus,
  type Payment,
  type PaymentChannel,
  type PaymentPlan,
  type Reading,
  type Reconciliation,
} from "./_data";

/**
 * Finans sayfalarının (Faturalar, Ödemeler) ORTAK, oturuma özel durumu.
 *
 * `_data.ts` değişmez; yapılan her işlem (ödeme ekle, itiraz kaydet, vade
 * uzat, tahakkuk çalıştır, mutabakat kapat, ödeme planı kur, kesme emri)
 * burada tek bir küçük depoda yaşar ve iki sayfa da aynı depoyu okur: bir
 * faturaya eklenen ödeme Ödemeler sayfasında da görünür. Yenileyince sıfırlanır
 * (demo). `useSyncExternalStore`: sayfa geçişinde durum kaybolmaz.
 */

/* --- Fatura geçmişi ------------------------------------------------------ */

export type EventTone = "neutral" | "success" | "warning" | "danger" | "primary";
export type InvoiceEvent = { id: string; at: string; when: string; title: string; detail?: string; tone: EventTone };

type InvoicePatch = {
  status?: InvoiceStatus;
  paid?: number;
  lateFee?: number;
  lateFeePaid?: number;
  due?: string;
  dispute?: string | null;
  cancelled?: boolean;
  events: InvoiceEvent[];
};

export type CutStage = "hatirlatma" | "ihtar" | "kesme-emri" | "kesildi" | "baglama-emri";
export const CUT_STAGE_LABEL: Record<CutStage, string> = {
  hatirlatma: "Hatırlatma",
  ihtar: "İhtar",
  "kesme-emri": "Kesme Emri",
  kesildi: "Enerji Kesildi",
  "baglama-emri": "Bağlama Emri",
};

export type AutoPayState = "aktif" | "onay-bekliyor" | "basarisiz";

type Store = {
  patches: Record<string, InvoicePatch>;
  extraInvoices: Invoice[];
  extraPayments: Payment[];
  reconOverrides: Record<string, Reconciliation>;
  /** Tutar farkı çözümü: ödeme kimliği → nasıl kapandığı. */
  reconNotes: Record<string, string>;
  plans: PaymentPlan[];
  cutStages: Record<string, CutStage>;
  autoPay: Record<string, AutoPayState>;
  /** Bu oturumda kapatılan günlük dosyalar. */
  closedDays: string[];
  /** Tahakkuk çalıştırılan dönemler. */
  accrued: string[];
  counter: number;
};

const initial: Store = {
  patches: {},
  extraInvoices: [],
  extraPayments: [],
  reconOverrides: {},
  reconNotes: {},
  plans: [...PAYMENT_PLANS],
  cutStages: {},
  autoPay: {},
  closedDays: [],
  accrued: [],
  counter: 1,
};

/** Finans dilimi: tek depoya (`_core.ts`) bağlı; başka sayfalar da aynı kaynağı görür. */
const slice = createSlice<Store>(initial);
const live = () => slice.get();

export const getFinance = (): Store => slice.get();

export function useFinance(): Store {
  return slice.use();
}
function set(next: Partial<Store>) {
  slice.set((s) => ({ ...s, ...next }));
}
const nextId = (prefix: string) => {
  const s = live();
  const id = `${prefix}${String(s.counter).padStart(4, "0")}`;
  slice.set({ ...s, counter: s.counter + 1 });
  return id;
};

/* --- Etkin fatura (taban + yama) ----------------------------------------- */

export type EffectiveInvoice = Invoice & { cancelled: boolean };

export function effectiveInvoice(inv: Invoice, s: Store): EffectiveInvoice {
  const p = s.patches[inv.id];
  if (!p) return { ...inv, cancelled: false };
  return {
    ...inv,
    status: p.status ?? inv.status,
    paid: p.paid ?? inv.paid,
    lateFee: p.lateFee ?? inv.lateFee,
    lateFeePaid: p.lateFeePaid ?? inv.lateFeePaid,
    due: p.due ?? inv.due,
    dispute: p.dispute === null ? undefined : (p.dispute ?? inv.dispute),
    cancelled: p.cancelled ?? false,
  };
}

export const allInvoices = (s: Store): EffectiveInvoice[] => [...s.extraInvoices, ...INVOICES].map((i) => effectiveInvoice(i, s));
export const invoiceOf = (id: string, s: Store) => {
  const base = s.extraInvoices.find((i) => i.id === id) ?? INVOICES.find((i) => i.id === id);
  return base ? effectiveInvoice(base, s) : undefined;
};

/** Vadesi geçmiş ve bakiyesi olan fatura mı (iptal olanlar hariç). */
export const isOverdue = (i: EffectiveInvoice) => !i.cancelled && i.status !== "odendi" && i.status !== "itirazli" && i.due < TODAY_KEY;
export const overdueDays = (i: EffectiveInvoice) => Math.max(0, daysBetween(parseDay(i.due), TODAY));

export function invoiceTab(i: EffectiveInvoice): "kesilen" | "odenen" | "geciken" | "itirazli" | "iptal" {
  if (i.cancelled) return "iptal";
  if (i.status === "odendi") return "odenen";
  if (i.status === "itirazli") return "itirazli";
  if (isOverdue(i)) return "geciken";
  return "kesilen";
}

/** Fatura için gösterilecek durum etiketi (iptal özel). */
export const statusOf = (i: EffectiveInvoice): InvoiceStatus | "iptal" => (i.cancelled ? "iptal" : i.status === "gecikti" || isOverdue(i) ? (i.status === "kismi" ? "kismi" : "gecikti") : i.status);

/* --- Fatura geçmişi (tabandan türer + oturum olayları) -------------------- */

const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });
const when = (key: string) => fmt.format(parseDay(key));

export function invoiceEvents(inv: EffectiveInvoice, s: Store): InvoiceEvent[] {
  const events: InvoiceEvent[] = [];
  const reading = READINGS.find((r) => r.customerId === inv.customerId && r.period === inv.period);
  if (reading) events.push({ id: "e-read", at: reading.date, when: when(reading.date), title: "Endeks okundu", detail: reading.source === "uzaktan" ? "Uzaktan okuma ile alındı" : "Saha okuması", tone: "neutral" });
  events.push({ id: "e-issue", at: inv.issued, when: when(inv.issued), title: "Fatura kesildi", detail: `Son ödeme tarihi ${when(inv.due)}`, tone: "primary" });
  for (const p of [...s.extraPayments, ...PAYMENTS].filter((x) => x.invoiceId === inv.id)) {
    events.push({
      id: `e-${p.id}`,
      at: p.date,
      when: when(p.date),
      title: `Ödeme alındı · ${CHANNEL_SHORT[p.channel]}`,
      detail: `${money(p.amount)}${p.lateFee ? ` · gecikme zammı ${money(p.lateFee)}` : ""} · ${p.reference}`,
      tone: "success",
    });
  }
  if (!inv.cancelled && inv.status !== "odendi" && inv.due < TODAY_KEY && !s.patches[inv.id]?.due) {
    events.push({ id: "e-late", at: addDaysKey(inv.due, 1), when: when(addDaysKey(inv.due, 1)), title: "Vade geçti", detail: "Gecikme zammı işliyor", tone: "danger" });
  }
  if (inv.dispute && !s.patches[inv.id]?.events.some((e) => e.id.startsWith("e-dispute"))) {
    events.push({ id: "e-dispute-base", at: addDaysKey(inv.issued, 6), when: when(addDaysKey(inv.issued, 6)), title: "İtiraz kaydı açıldı", detail: inv.dispute, tone: "warning" });
  }
  events.push(...(s.patches[inv.id]?.events ?? []));
  return events.sort((a, b) => (a.at === b.at ? a.id.localeCompare(b.id) : a.at < b.at ? -1 : 1));
}
const addDaysKey = (key: string, n: number) => dayKey(addDays(parseDay(key), n));

export const CHANNEL_SHORT: Record<PaymentChannel, string> = { banka: "Banka", ptt: "PTT", online: "Online", otomatik: "Otomatik" };
const money = (kurus: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);

function addEvent(id: string, event: Omit<InvoiceEvent, "id" | "at" | "when"> & { key: string }) {
  const prev = live().patches[id] ?? { events: [] };
  const entry: InvoiceEvent = { id: nextId(`e-${event.key}-`), at: TODAY_KEY, when: when(TODAY_KEY), title: event.title, detail: event.detail, tone: event.tone };
  return { ...prev, events: [...prev.events, entry] } as InvoicePatch;
}

/* --- Fatura işlemleri ---------------------------------------------------- */

export function recordPayment(invoiceId: string, input: { channel: PaymentChannel; amount: number; reference: string; /** Ödeme tarihi (`YYYY-MM-DD`); verilmezse bugün. Gelecek olamaz. */ date?: string }) {
  const inv = invoiceOf(invoiceId, live());
  if (!inv) return;
  /* Gecikme zammı: vadeden bugüne kalan ANAPARA üzerinden TEK fonksiyonla; ödemeyle
     birlikte tahsil edilir (ödeme = anapara + zam). Zam tahsil edilmeden fatura "Ödendi" olmaz. */
  const payDate = input.date && input.date <= TODAY_KEY ? input.date : TODAY_KEY;
  const dueFee = inv.due < payDate ? lateInterest(Math.max(0, inv.total - inv.paid), inv.due, payDate, getLateRates()) : 0;
  const feeToCollect = Math.max(0, Math.max(inv.lateFee, dueFee) - inv.lateFeePaid);
  const principal = Math.min(input.amount, Math.max(0, inv.total - inv.paid));
  const payment: Payment = {
    id: nextId("P-M"),
    invoiceId,
    customerId: inv.customerId,
    date: payDate,
    channel: input.channel,
    amount: principal,
    lateFee: feeToCollect,
    recon: "bekliyor",
    reference: input.reference || `${input.channel === "banka" ? "BNK" : input.channel === "ptt" ? "PTT" : input.channel === "online" ? "WEB" : "OTO"}${String(40_000_000 + live().counter * 137)}`,
  };
  const paid = inv.paid + principal;
  const lateFeePaid = inv.lateFeePaid + feeToCollect;
  const lateFee = Math.max(inv.lateFee, dueFee);
  const status: InvoiceStatus = deriveStatus({ total: inv.total, paid, due: inv.due, disputed: false }, TODAY_KEY);
  const detail = `${money(principal)}${feeToCollect ? ` + gecikme zammı ${money(feeToCollect)}` : ""} · ${CHANNEL_SHORT[input.channel]}`;
  const patch = { ...addEvent(invoiceId, { key: "pay", title: "Elle tahsilat girildi", detail, tone: "success" }), paid, lateFee, lateFeePaid, status, dispute: null as null };
  set({ extraPayments: [payment, ...live().extraPayments], patches: { ...live().patches, [invoiceId]: patch } });
  audit("Ödeme girdi", `${invoiceId} · ${inv.customerId}`, `Bakiye ${money(inv.total - inv.paid)}`, `Bakiye ${money(inv.total - paid)}`);
}

export function extendDue(invoiceId: string, days: number) {
  const inv = invoiceOf(invoiceId, live());
  if (!inv) return;
  const due = addDaysKey(inv.due < TODAY_KEY ? TODAY_KEY : inv.due, days);
  const status: InvoiceStatus = deriveStatus({ total: inv.total, paid: inv.paid, due, disputed: inv.status === "itirazli" }, TODAY_KEY);
  set({ patches: { ...live().patches, [invoiceId]: { ...addEvent(invoiceId, { key: "due", title: "Vade uzatıldı", detail: `Yeni son ödeme tarihi ${when(due)}`, tone: "primary" }), due, status } } });
  audit("Vade uzattı", invoiceId, `Vade ${when(inv.due)}`, `Vade ${when(due)}`);
}

/** Vadeyi doğrudan bir tarihe çeker (uzatmayı geri almak için). */
export function setDue(invoiceId: string, due: string, note = "Vade geri alındı") {
  const inv = invoiceOf(invoiceId, live());
  if (!inv) return;
  const status: InvoiceStatus = deriveStatus({ total: inv.total, paid: inv.paid, due, disputed: inv.status === "itirazli" }, TODAY_KEY);
  set({ patches: { ...live().patches, [invoiceId]: { ...addEvent(invoiceId, { key: "due", title: note, detail: `Son ödeme tarihi ${when(due)}`, tone: "neutral" }), due, status } } });
  audit(note, invoiceId, `Vade ${when(inv.due)}`, `Vade ${when(due)}`);
}

/**
 * Düzeltme faturası: iptal edilen faturanın okumasından, güncel parametrelerle
 * yeniden hesaplanır (`corrects` bağı); tutar kalemlerden tutar, borç/ödeme sıfırdan başlar.
 */
export function issueCorrection(invoiceId: string): Invoice | null {
  const inv = invoiceOf(invoiceId, live());
  if (!inv) return null;
  const reading = effectiveReadings().find((r) => r.customerId === inv.customerId && r.period === inv.period);
  if (!reading) return null;
  const draft = buildDraft(reading);
  const { readingId, warnings, ...rest } = draft;
  void readingId;
  void warnings;
  const id = `${inv.id.split("-D")[0]}-D${String((live().extraInvoices.filter((x) => x.corrects === inv.id).length || 0) + 1)}`;
  const correction: Invoice = { ...rest, id, corrects: inv.id, issued: TODAY_KEY, due: addDaysKey(TODAY_KEY, 14), status: "kesildi", paid: 0, lateFee: 0, lateFeePaid: 0 };
  set({ extraInvoices: [correction, ...live().extraInvoices] });
  audit("Düzeltme faturası kesti", id, inv.id, `${money(correction.total)}`);
  return correction;
}

export function fileDispute(invoiceId: string, reason: string, note: string) {
  const text = note.trim() ? `${reason}: ${note.trim()}` : reason;
  set({ patches: { ...live().patches, [invoiceId]: { ...addEvent(invoiceId, { key: "dispute", title: "İtiraz kaydı açıldı", detail: text, tone: "warning" }), status: "itirazli", dispute: reason } } });
  audit("Fatura itirazı açtı", invoiceId, undefined, reason);
}

export function resolveDispute(invoiceId: string, outcome: "kabul" | "red") {
  const inv = invoiceOf(invoiceId, live());
  if (!inv) return;
  const status: InvoiceStatus = deriveStatus({ total: inv.total, paid: inv.paid, due: inv.due, disputed: false }, TODAY_KEY);
  set({
    patches: {
      ...live().patches,
      [invoiceId]: {
        ...addEvent(invoiceId, { key: "dispute", title: outcome === "kabul" ? "İtiraz kabul edildi" : "İtiraz reddedildi", detail: outcome === "kabul" ? "Düzeltme faturası kesilecek" : "Fatura geçerli, tahsilat sürüyor", tone: outcome === "kabul" ? "success" : "neutral" }),
        status,
        dispute: null,
      },
    },
  });
  audit(outcome === "kabul" ? "Fatura itirazını kabul etti" : "Fatura itirazını reddetti", invoiceId, "İtirazlı", status);
}

export function cancelInvoice(invoiceId: string, rebill: boolean) {
  set({
    patches: {
      ...live().patches,
      [invoiceId]: { ...addEvent(invoiceId, { key: "cancel", title: rebill ? "İptal edildi, düzeltme faturası kesilecek" : "Fatura iptal edildi", detail: "İptal faturası sisteme işlendi", tone: "danger" }), cancelled: true },
    },
  });
  audit("Fatura iptal etti", invoiceId, "Geçerli", rebill ? "İptal, düzeltme bekliyor" : "İptal");
}

/* --- Gönderim (e-posta, SMS) ---------------------------------------------- */

export function logSend(invoiceId: string, via: "e-posta" | "sms" | "pdf") {
  const title = via === "pdf" ? "PDF indirildi" : via === "sms" ? "Hatırlatma SMS'i gönderildi" : "Fatura e-postası gönderildi";
  set({ patches: { ...live().patches, [invoiceId]: addEvent(invoiceId, { key: "send", title, tone: "neutral" }) } });
}

/* --- Tahakkuk (taslak fatura) --------------------------------------------- */

export type Draft = Invoice & { readingId: string; warnings: string[] };

/** Taslak, gerçek faturalarla AYNI çekirdeği (`_billing.ts`) ve Ayarlar'daki güncel parametreleri kullanır. */
export function buildDraft(r: Reading): Draft {
  const c = customer(r.customerId);
  const sup = supplier(c.supplierId);
  const bill = computeInvoice({ kind: c.kind, voltage: c.voltage, usage: r.usage, reactive: r.reactive, demandKw: r.demandKw, contractKw: c.contractKw, prices: sup.prices }, getBillingParams());
  const issued = TODAY_KEY;
  const warnings: string[] = [];
  if (r.status === "supheli") warnings.push("Şüpheli okuma: onaylanmadan faturalanamaz");
  if (r.source === "tahmini") warnings.push("Tahmini endeks: gerçek okumada mahsup edilecek");
  return {
    id: `F-${r.period.replace("-", "")}-${r.id.slice(2, 6)}${r.id.slice(6, 8)}`,
    customerId: c.id,
    supplierId: sup.id,
    period: r.period,
    issued,
    due: addDaysKey(issued, 14),
    usageKwh: Math.max(0, r.usage.total),
    energy: bill.energy,
    distribution: bill.distribution,
    yekdem: bill.yekdem,
    funds: bill.funds,
    btv: bill.btv,
    vat: bill.vat,
    reactive: bill.reactive,
    power: bill.power,
    total: bill.total,
    paid: 0,
    lateFee: 0,
    lateFeePaid: 0,
    status: "kesildi",
    issuer: "tedarikci",
    readingId: r.id,
    warnings,
  };
}

/** Faturası henüz kesilmemiş, okuması hazır olanlar: taslak tahakkuk. */
export function draftsFor(period: string, s: Store): Draft[] {
  const have = new Set([...INVOICES, ...s.extraInvoices].map((i) => i.id));
  /* Şüpheli okuma onaylanmadan faturalanmaz (Okumalar'da onay serbest bırakır). */
  return effectiveReadings()
    .filter((r) => r.period === period && r.status !== "bekliyor" && r.status !== "supheli")
    .map(buildDraft)
    .filter((d) => !have.has(d.id));
}
export const pendingReadings = (period: string) => effectiveReadings().filter((r) => r.period === period && r.status === "bekliyor").length;

export function runAccrual(period: string): { count: number; total: number } {
  const drafts = draftsFor(period, live());
  const created: Invoice[] = drafts.map((d) => {
    const { readingId, warnings, ...invoice } = d;
    void readingId;
    void warnings;
    return invoice;
  });
  set({ extraInvoices: [...created, ...live().extraInvoices], accrued: [...live().accrued, period] });
  audit("Tahakkuk çalıştırdı", period, undefined, `${created.length} fatura`);
  return { count: created.length, total: created.reduce((s, i) => s + i.total, 0) };
}

/** Tahakkuku geri al: o dönem için bu oturumda kesilen (ödemesi olmayan) faturalar silinir. */
export function undoAccrual(period: string): number {
  const keep: Invoice[] = [];
  let removed = 0;
  for (const i of live().extraInvoices) {
    const accrued = i.period === period && !i.corrects && i.paid === 0 && !live().patches[i.id];
    if (accrued) removed++;
    else keep.push(i);
  }
  set({ extraInvoices: keep, accrued: live().accrued.filter((p) => p !== period) });
  audit("Tahakkuku geri aldı", period, undefined, `${removed} fatura`);
  return removed;
}

/* --- Ödemeler: etkin liste ve mutabakat ----------------------------------- */

export type EffectivePayment = Payment & { manual: boolean };
export const allPayments = (s: Store): EffectivePayment[] => [
  ...s.extraPayments.map((p) => ({ ...p, recon: s.reconOverrides[p.id] ?? p.recon, manual: true })),
  ...PAYMENTS.map((p) => ({ ...p, recon: s.reconOverrides[p.id] ?? p.recon, manual: false })),
];

export type BankLine = { id: string; paymentId: string; reference: string; invoiceId: string; customerId: string; systemAmount: number; bankAmount: number; kind: "eksik" | "fazla" | "mukerrer" };

/**
 * Son dört günün banka dosyasında eşleşmeyen satırlar: bekleyen ödemelerin
 * altıda biri tutar farklı (eksik ya da fazla), bir kısmı mükerrer. Eski
 * dönemlerden kalan farklar bu günlük dosyanın konusu değil, çözüm bekleyen
 * sayısı `olderDiffs` ile ayrıca söylenir.
 */
export function unmatchedLines(s: Store): BankLine[] {
  const from = dayKey(addDays(TODAY, -3));
  const recent = allPayments(s).filter((p) => p.date >= from && p.recon !== "mutabik" && !p.manual);
  const lines: BankLine[] = [];
  /* Seçim kimlikten türer (sıraya bağlı değil): biri çözülünce öteki satırlar yer değiştirmez. */
  recent.forEach((p) => {
    const h = hash(`bank:${p.id}`);
    const base = { paymentId: p.id, reference: p.reference, invoiceId: p.invoiceId, customerId: p.customerId, systemAmount: p.amount };
    if (h % 6 === 0) {
      const diff = 500 + ((p.amount * 7 + h) % 4200);
      const over = (h >> 3) % 2 === 0;
      lines.push({ id: `B-${p.id}`, ...base, bankAmount: over ? p.amount + diff : Math.max(100, p.amount - diff), kind: over ? "fazla" : "eksik" });
    } else if (h % 17 === 5) {
      lines.push({ id: `B-D-${p.id}`, ...base, bankAmount: p.amount, kind: "mukerrer" });
    }
  });
  return lines;
}
/** Günlük dosyanın dışında kalan, eski dönemlerden bekleyen tutar farkı sayısı. */
export const olderDiffs = (s: Store) => allPayments(s).filter((p) => p.recon === "farkli").length;

export function resolveLine(line: BankLine, how: "faturaya" | "avans" | "iade") {
  const label = how === "faturaya" ? "Faturaya atandı" : how === "avans" ? "Avansa alındı" : "İade talimatı verildi";
  set({ reconOverrides: { ...live().reconOverrides, [line.paymentId]: "mutabik" }, reconNotes: { ...live().reconNotes, [line.paymentId]: label } });
}

/** Banka dosyasıyla eşleşen (satır olmayan) bekleyen ödemeleri mutabık yapar; eşleşmeyenler elle çözülür. */
export function approveMatched(excludePaymentIds: readonly string[], dayKeys: readonly string[]): number {
  const overrides = { ...live().reconOverrides };
  let n = 0;
  for (const p of allPayments(live())) {
    if (p.recon === "bekliyor" && dayKeys.includes(p.date) && !excludePaymentIds.includes(p.id)) {
      overrides[p.id] = "mutabik";
      n++;
    }
  }
  set({ reconOverrides: overrides });
  audit("Eşleşen ödemeleri onayladı", dayKeys.join(", "), undefined, `${n} ödeme`);
  return n;
}

/** Günü kapat: bekleyen ödemeleri mutabık yap (eşleşmeyen satır kalmamışsa). */
export function closeReconciliation(dayKeys: string[]) {
  const overrides = { ...live().reconOverrides };
  let n = 0;
  for (const p of allPayments(live())) {
    if (p.recon === "bekliyor" && dayKeys.includes(p.date)) {
      overrides[p.id] = "mutabik";
      n++;
    }
  }
  set({ reconOverrides: overrides, closedDays: [...live().closedDays, ...dayKeys] });
  return n;
}

/* --- Ödeme planları -------------------------------------------------------- */

export function debtOf(customerId: string, s: Store) {
  return allInvoices(s)
    .filter((i) => i.customerId === customerId && !i.cancelled && i.status !== "odendi" && i.status !== "itirazli" && i.due < TODAY_KEY)
    .reduce((sum, i) => sum + (i.total - i.paid), 0);
}

export function createPlan(customerId: string, installments: number, monthlyRatePct: number) {
  const principal = debtOf(customerId, live());
  const total = Math.round(principal * (1 + (monthlyRatePct / 100) * installments * 0.5));
  const plan: PaymentPlan = {
    id: `PL-2026${String(100 + live().plans.length)}`,
    customerId,
    total,
    installments,
    paid: 0,
    next: dayKey(addDays(TODAY, 30)),
    status: "devam",
  };
  const patches = { ...live().patches };
  for (const i of allInvoices(live()).filter((x) => x.customerId === customerId && isOverdue(x))) {
    patches[i.id] = { ...(patches[i.id] ?? { events: [] }), events: [...(patches[i.id]?.events ?? []), { id: nextId("e-plan-"), at: TODAY_KEY, when: when(TODAY_KEY), title: "Ödeme planına bağlandı", detail: `${plan.id} · ${installments} taksit`, tone: "primary" }] };
  }
  set({ plans: [plan, ...live().plans], patches });
  return plan;
}
export function cancelPlan(id: string) {
  set({ plans: live().plans.map((p) => (p.id === id ? { ...p, status: "bozuldu" as const } : p)) });
}
export function payInstallment(id: string) {
  set({
    plans: live().plans.map((p) => {
      if (p.id !== id || p.status !== "devam") return p;
      const paid = p.paid + 1;
      return { ...p, paid, status: paid >= p.installments ? ("tamamlandi" as const) : p.status, next: dayKey(addDays(parseDay(p.next), 30)) };
    }),
  });
}
export const planInstallment = (p: PaymentPlan) => Math.round(p.total / p.installments);

/** Plan taksit takvimi (önizleme ve ayrıntı). */
export function schedule(total: number, installments: number, firstKey: string, paid = 0) {
  const each = Math.floor(total / installments);
  return Array.from({ length: installments }, (_, i) => ({
    no: i + 1,
    due: dayKey(addDays(parseDay(firstKey), i * 30)),
    amount: i === installments - 1 ? total - each * (installments - 1) : each,
    paid: i < paid,
  }));
}

/* --- Otomatik ödeme -------------------------------------------------------- */

const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};
export type AutoPayRow = { customerId: string; bank: string; state: AutoPayState; last: string | null; lastAmount: number | null };
const BANKS = ["Ova Bankası", "Merkez Katılım", "Yeşilırmak Bank", "Kuzey Ticaret Bankası"];

export function autoPayRows(s: Store): AutoPayRow[] {
  return CUSTOMERS.filter((c) => c.autoPay).map((c) => {
    const h = hash(`auto:${c.id}`) % 100;
    const base: AutoPayState = h < 78 ? "aktif" : h < 90 ? "onay-bekliyor" : "basarisiz";
    const last = allPayments(s).find((p) => p.customerId === c.id && p.channel === "otomatik");
    return { customerId: c.id, bank: BANKS[hash(`bank:${c.id}`) % BANKS.length], state: s.autoPay[c.id] ?? base, last: last?.date ?? null, lastAmount: last?.amount ?? null };
  });
}
export function retryAutoPay(customerId: string) {
  set({ autoPay: { ...live().autoPay, [customerId]: "aktif" } });
}

/* --- Kesme ve bağlama ------------------------------------------------------- */

export function cutStageOf(customerId: string, days: number, s: Store): CutStage {
  return s.cutStages[customerId] ?? (days >= 31 ? "kesme-emri" : days >= 15 ? "ihtar" : "hatirlatma");
}
/** Bağlama sonrası: elle verilen aşama kalkar, aşama yeniden gecikme gününden türer. */
export function clearCutStage(customerId: string) {
  const next = { ...live().cutStages };
  delete next[customerId];
  set({ cutStages: next });
}
export function advanceCut(ids: string[], stage: CutStage) {
  const next = { ...live().cutStages };
  ids.forEach((id) => (next[id] = stage));
  set({ cutStages: next });
}

/* --- Bakiye yaşlandırma ------------------------------------------------------ */

export const AGE_BUCKETS = [
  { id: "0-30", label: "0-30 gün", min: 1, max: 30 },
  { id: "31-60", label: "31-60 gün", min: 31, max: 60 },
  { id: "61-90", label: "61-90 gün", min: 61, max: 90 },
  { id: "90-ustu", label: "90 gün üstü", min: 91, max: Infinity },
] as const;

export function aging(s: Store) {
  const overdue = allInvoices(s).filter(isOverdue);
  return AGE_BUCKETS.map((b) => {
    const rows = overdue.filter((i) => overdueDays(i) >= b.min && overdueDays(i) <= b.max);
    return { ...b, count: rows.length, balance: rows.reduce((sum, i) => sum + balanceOf(i), 0) };
  });
}

/** Faturanın bağlı olduğu dönemin etiketi için kısa yardımcı. */
export const periodIsCurrent = (period: string) => period === CURRENT_PERIOD;
export const periodIndex = (period: string) => PERIODS_12.indexOf(period);
