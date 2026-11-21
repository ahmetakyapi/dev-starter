import { useMemo } from "react";
import { audit, auditDenied } from "./_audit";
import { lateInterest } from "./_billing";
import { createSlice, nextId } from "./_core";
import {
  CURRENT_PERIOD,
  CUSTOMERS,
  READINGS,
  TODAY,
  TODAY_KEY,
  addDays,
  customer,
  dayKey,
  parseDay,
  supplier,
  type Reading,
} from "./_data";
import { allInvoices, allPayments, extendDue, getFinance, recordPayment, resolveLine, setDue, type BankLine, type EffectiveInvoice } from "./_data-finans";
import { effectiveReadings } from "./_ops";
import { can, currentUser } from "./_permissions";
import { getLateRates } from "./_settings";
import { createCredit, refundCredit } from "./_store";
import { TEMPLATES_START, TEMPLATE_SAMPLE } from "./_data-operasyon";

/**
 * Faturalar ve Ödemeler sayfalarının ORTAK yardımcıları: fatura kalemleri,
 * tahsilat kuyruğu (aranma durumu, söz tarihi), kayıtlı görünümler, ödeme
 * doğrulama, vade uzatma (limit + gerekçe + yetki + iki göz) ve tahakkuk
 * önizlemesi. Durum `_core.ts`'in tek yayın kanalındaki dilimlerde durur;
 * motor mantığına (`_billing.ts`, `_store.ts`) dokunmaz, onları çağırır.
 */

/* ======================================================================== */
/* Fatura kalemleri                                                          */
/* ======================================================================== */

export type InvoiceLine = { id: string; label: string; detail?: string; amount: number; tone?: "danger" | "warning" };

const tr = new Intl.NumberFormat("tr-TR");
const tr2 = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** Faturanın okuması: kendi dönemindeki okuma (iptal/düzeltme faturalarında aynı dönem). */
export const readingOfInvoice = (inv: { customerId: string; period: string }): Reading | undefined =>
  effectiveReadings().find((r) => r.customerId === inv.customerId && r.period === inv.period) ?? READINGS.find((r) => r.customerId === inv.customerId && r.period === inv.period);

/**
 * Fatura belgesinin kalemleri. Hepsi faturanın kendi alanlarından gelir ve
 * `Σ kalemler = fatura.total` (gecikme zammı toplama GİRMEZ, ayrı alacaktır).
 * Çok zamanlı tarifede enerji bedeli dilim dilim yazılır (T1/T2/T3 fiyatlı).
 */
export function invoiceLines(inv: EffectiveInvoice): InvoiceLine[] {
  const c = customer(inv.customerId);
  const sup = supplier(inv.supplierId);
  const r = readingOfInvoice(inv);
  const multi = c.tariff === "cok-zamanli";
  let energyDetail: string | undefined;
  if (r) {
    energyDetail = multi
      ? `T1 ${tr.format(Math.round(r.usage.t1))} kWh × ${tr2.format(sup.prices.t1)} ₺ · T2 ${tr.format(Math.round(r.usage.t2))} kWh × ${tr2.format(sup.prices.t2)} ₺ · T3 ${tr.format(Math.round(r.usage.t3))} kWh × ${tr2.format(sup.prices.t3)} ₺`
      : `${tr.format(Math.round(r.usage.total))} kWh × ${tr2.format(sup.prices.t1)} ₺`;
  }
  const lines: InvoiceLine[] = [
    { id: "energy", label: "Enerji bedeli", detail: energyDetail, amount: inv.energy },
    { id: "dist", label: "Dağıtım bedeli", detail: "İletim (sistem kullanım) bedeli dahil", amount: inv.distribution },
    { id: "yekdem", label: "YEKDEM bedeli", amount: inv.yekdem },
    { id: "funds", label: "Fonlar", detail: "Enerji fonu payı", amount: inv.funds },
    { id: "btv", label: "Belediye tüketim vergisi", amount: inv.btv },
  ];
  if (inv.reactive > 0) lines.push({ id: "reactive", label: "Reaktif enerji bedeli", detail: "Sınırı aşan endüktif/kapasitif kısım", amount: inv.reactive, tone: "warning" });
  if (inv.power > 0) lines.push({ id: "power", label: "Sözleşme gücü aşım bedeli", detail: "Talep, sözleşme gücünü aştı", amount: inv.power, tone: "warning" });
  lines.push({ id: "vat", label: "KDV", amount: inv.vat });
  return lines;
}

/** Kalemlerin toplamı (doğrulama: fatura toplamına eşit olmalı). */
export const linesTotal = (lines: readonly InvoiceLine[]) => lines.reduce((s, l) => s + l.amount, 0);

/** Fatura düzenleyen tarafın belge başlığı: abone faturasını tedarikçi keser. */
export function issuerOf(inv: EffectiveInvoice) {
  if (inv.issuer === "dagitim") return { name: "Kuzeyova Elektrik Dağıtım A.Ş.", role: "Dağıtım şirketi", note: "Tedarikçiye kesilen dağıtım bedeli faturası" };
  const s = supplier(inv.supplierId);
  return { name: s.name, role: s.kind === "gorevli" ? "Görevli tedarik şirketi" : "Perakende satış şirketi", note: `Lisans ${s.license} · dağıtım bedeli kalemi Kuzeyova Elektrik Dağıtım adına tahsil edilir` };
}

/* ======================================================================== */
/* Ödenecek tutar (anapara + gecikme zammı), ödeme doğrulaması               */
/* ======================================================================== */

export type DueNow = { principal: number; fee: number; total: number; days: number };

/** Belirli bir ödeme tarihinde ödenmesi gereken: kalan anapara + ödenmemiş gecikme zammı. */
export function dueNow(inv: EffectiveInvoice, date: string = TODAY_KEY): DueNow {
  const principal = Math.max(0, inv.total - inv.paid);
  const accrued = inv.due < date ? lateInterest(principal, inv.due, date, getLateRates()) : 0;
  const fee = Math.max(0, Math.max(inv.lateFee, accrued) - inv.lateFeePaid);
  const days = Math.max(0, Math.round((parseDay(date).getTime() - parseDay(inv.due).getTime()) / 86_400_000));
  return { principal, fee, total: principal + fee, days: inv.due < date ? days : 0 };
}

export type PaymentCheck = { errors: string[]; warnings: string[]; principal: number; fee: number; excess: number };

/** Tahsilat girişi denetimi: tutar, tarih, mükerrer referans, fazla ödeme. */
export function checkPayment(inv: EffectiveInvoice, input: { amount: number; reference: string; date: string }): PaymentCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const due = dueNow(inv, input.date);
  if (!(input.amount > 0)) errors.push("Tutar sıfırdan büyük olmalı.");
  if (input.date > TODAY_KEY) errors.push("Ödeme tarihi gelecekte olamaz.");
  if (input.date < inv.issued) errors.push("Ödeme tarihi fatura tarihinden önce olamaz.");
  const ref = input.reference.trim();
  if (ref && allPayments(getFinance()).some((p) => p.reference.toLowerCase() === ref.toLowerCase())) errors.push("Bu referans numarasıyla kayıtlı bir ödeme var (mükerrer).");
  if (input.date < TODAY_KEY) warnings.push("Geçmiş tarihli ödeme: gecikme zammı ödeme tarihine göre hesaplandı.");
  if (due.fee > 0 && input.amount > 0 && input.amount < due.fee) errors.push(`Tutar gecikme zammından (${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(due.fee / 100)}) az. Ödeme önce zamdan, sonra anaparadan düşer.`);
  const principalPaid = Math.min(Math.max(0, input.amount - due.fee), due.principal);
  const excess = Math.max(0, input.amount - due.fee - due.principal);
  if (excess > 0) warnings.push("Tutar borcun üstünde: fazlası müşterinin avans alacağına yazılır.");
  return { errors, warnings, principal: principalPaid, fee: due.fee, excess };
}

/** Ödemeyi uygular: fazlası alacak (`fazla-odeme`) olur; denetim izine yazılır. */
export function submitPayment(inv: EffectiveInvoice, input: { amount: number; channel: "banka" | "ptt" | "online" | "otomatik"; reference: string; date: string }) {
  if (!can("odeme")) {
    auditDenied("Ödeme girdi", inv.id);
    return { ok: false as const, reason: "yetki" as const };
  }
  const check = checkPayment(inv, input);
  if (check.errors.length) return { ok: false as const, reason: "dogrulama" as const, errors: check.errors };
  recordPayment(inv.id, { channel: input.channel, amount: check.principal, reference: input.reference.trim(), date: input.date });
  if (check.excess > 0) createCredit(inv.customerId, "fazla-odeme", check.excess);
  return { ok: true as const, check };
}

/* ======================================================================== */
/* Tahsilat kuyruğu: aranma durumu ve söz tarihi                             */
/* ======================================================================== */

export type CallState = "aranmadi" | "ulasilamadi" | "soz-verdi" | "plan-onerildi";
export const CALL_STATE_LABEL: Record<CallState, string> = { aranmadi: "Aranmadı", ulasilamadi: "Ulaşılamadı", "soz-verdi": "Söz verdi", "plan-onerildi": "Plan önerildi" };
export type FollowUp = { state: CallState; promiseDate?: string; note?: string; by: string; at: string };

const followUps = createSlice<Readonly<Record<string, FollowUp>>>({});
export const useFollowUps = () => followUps.use();
export const getFollowUps = () => followUps.get();

/** Bir abonenin tahsilat görüşmesini kaydeder (söz tarihi bugünden sonra olmalı). */
export function logFollowUp(customerId: string, state: CallState, input: { promiseDate?: string; note?: string } = {}) {
  if (!can("odeme")) {
    auditDenied("Tahsilat görüşmesi kaydetti", customerId);
    return { ok: false as const, error: "Yetkiniz yok." };
  }
  if (state === "soz-verdi") {
    if (!input.promiseDate) return { ok: false as const, error: "Söz tarihi gerekli." };
    if (input.promiseDate <= TODAY_KEY) return { ok: false as const, error: "Söz tarihi bugünden sonra olmalı." };
  }
  followUps.set((m) => ({ ...m, [customerId]: { state, promiseDate: input.promiseDate, note: input.note?.trim() || undefined, by: currentUser().name, at: TODAY_KEY } }));
  audit("Tahsilat görüşmesi kaydetti", customerId, undefined, `${CALL_STATE_LABEL[state]}${input.promiseDate ? ` · ${input.promiseDate}` : ""}`);
  return { ok: true as const };
}

export const followUpOf = (customerId: string): FollowUp => getFollowUps()[customerId] ?? { state: "aranmadi", by: "", at: "" };

/** Söz tarihi gelmiş (ya da geçmiş) ve hâlâ ödemeyen abone mi? */
export const promiseBroken = (f: FollowUp) => f.state === "soz-verdi" && !!f.promiseDate && f.promiseDate <= TODAY_KEY;

/* ======================================================================== */
/* Kayıtlı görünümler (sayfa başına)                                         */
/* ======================================================================== */

export type SavedViewRow<T> = { id: string; label: string; snapshot: T };
const savedViews = createSlice<Readonly<Record<string, readonly SavedViewRow<unknown>[]>>>({});

export function useSavedViewRows<T>(page: string): readonly SavedViewRow<T>[] {
  const all = savedViews.use();
  return useMemo(() => (all[page] ?? []) as readonly SavedViewRow<T>[], [all, page]);
}
export function saveViewRow<T>(page: string, label: string, snapshot: T): SavedViewRow<T> {
  const row: SavedViewRow<T> = { id: nextId(`sv-${page}-`), label, snapshot };
  savedViews.set((m) => ({ ...m, [page]: [...(m[page] ?? []), row as SavedViewRow<unknown>] }));
  audit("Kayıtlı görünüm oluşturdu", page, undefined, label);
  return row;
}
export function deleteViewRow(page: string, id: string) {
  savedViews.set((m) => ({ ...m, [page]: (m[page] ?? []).filter((r) => r.id !== id) }));
}

/* ======================================================================== */
/* Vade uzatma: limit + gerekçe + yetki + iki göz                            */
/* ======================================================================== */

export const EXTEND_DIRECT_MAX_DAYS = 30;
export const EXTEND_MAX_INVOICES = 50;

export type ExtensionRequest = {
  id: string;
  invoiceIds: readonly string[];
  days: number;
  reason: string;
  requestedBy: string;
  at: string;
  status: "bekliyor" | "onaylandi" | "reddedildi";
  decidedBy?: string;
  /** Uygulandıysa geri almak için önceki vadeler. */
  previous?: Readonly<Record<string, string>>;
};
const extensions = createSlice<readonly ExtensionRequest[]>([]);
export const useExtensionRequests = () => extensions.use();

export type ExtendResult =
  | { ok: true; status: "uygulandi"; count: number; undo: () => void }
  | { ok: true; status: "onay-bekliyor"; request: ExtensionRequest }
  | { ok: false; error: string };

function applyExtension(ids: readonly string[], days: number) {
  const previous: Record<string, string> = {};
  const fin = getFinance();
  for (const id of ids) {
    const inv = allInvoices(fin).find((i) => i.id === id);
    if (!inv) continue;
    previous[id] = inv.due;
    extendDue(id, days);
  }
  return previous;
}

/** Vade uzatma isteği. 30 günü aşan uzatma ikinci bir yetkilinin onayını bekler. */
export function requestExtension(ids: readonly string[], days: number, reason: string): ExtendResult {
  if (!can("fatura")) {
    auditDenied("Vade uzattı", `${ids.length} fatura`);
    return { ok: false, error: "Vade uzatma yetkiniz yok." };
  }
  if (reason.trim().length < 5) return { ok: false, error: "Gerekçe yazın (en az 5 karakter)." };
  if (ids.length === 0) return { ok: false, error: "Fatura seçilmedi." };
  if (ids.length > EXTEND_MAX_INVOICES) return { ok: false, error: `Tek işlemde en çok ${EXTEND_MAX_INVOICES} fatura.` };
  if (days > EXTEND_DIRECT_MAX_DAYS) {
    const request: ExtensionRequest = { id: nextId("VU-"), invoiceIds: ids, days, reason: reason.trim(), requestedBy: currentUser().name, at: TODAY_KEY, status: "bekliyor" };
    extensions.set((l) => [request, ...l]);
    audit("Vade uzatma onayı istedi", `${ids.length} fatura`, undefined, `${days} gün · ${reason.trim()}`);
    return { ok: true, status: "onay-bekliyor", request };
  }
  const previous = applyExtension(ids, days);
  audit("Vadeyi toplu uzattı", `${ids.length} fatura`, undefined, `${days} gün · ${reason.trim()}`);
  return {
    ok: true,
    status: "uygulandi",
    count: ids.length,
    undo: () => {
      for (const [id, due] of Object.entries(previous)) setDue(id, due);
    },
  };
}

/** İkinci göz: isteyen kendi isteğini onaylayamaz. */
export function decideExtension(id: string, ok: boolean): { ok: true } | { ok: false; error: string } {
  const r = extensions.get().find((x) => x.id === id);
  if (!r || r.status !== "bekliyor") return { ok: false, error: "İstek bulunamadı ya da karara bağlandı." };
  if (!can("fatura")) return { ok: false, error: "Karar verme yetkiniz yok." };
  if (r.requestedBy === currentUser().name) return { ok: false, error: "Kendi isteğinizi onaylayamazsınız." };
  const previous = ok ? applyExtension(r.invoiceIds, r.days) : undefined;
  extensions.set((l) => l.map((x) => (x.id === id ? { ...x, status: ok ? ("onaylandi" as const) : ("reddedildi" as const), decidedBy: currentUser().name, previous } : x)));
  audit(ok ? "Vade uzatmayı onayladı" : "Vade uzatmayı reddetti", id, `${r.invoiceIds.length} fatura`, `${r.days} gün`);
  return { ok: true };
}

/* ======================================================================== */
/* Tahakkuk önizlemesi (kuru çalıştırma)                                     */
/* ======================================================================== */

export type AccrualPreview = { eligible: number; flaggedExcluded: number; pending: number; estimated: number };

/** Dönem için: faturalanacak okumalar, şüpheli (hariç), bekleyen ve tahmini (mahsup bayraklı) sayıları. */
export function accrualPreview(period: string): AccrualPreview {
  const rs = effectiveReadings().filter((r) => r.period === period);
  return {
    eligible: rs.filter((r) => r.status !== "bekliyor" && r.status !== "supheli").length,
    flaggedExcluded: rs.filter((r) => r.status === "supheli").length,
    pending: rs.filter((r) => r.status === "bekliyor").length,
    estimated: rs.filter((r) => r.source === "tahmini" && r.status !== "bekliyor" && r.status !== "supheli").length,
  };
}

/* ======================================================================== */
/* Bildirim şablonundan SMS                                                  */
/* ======================================================================== */

/** Ayarlar → Bildirim Şablonları'ndaki şablonla ("vade" ya da "fatura") mesaj üretir. */
export function smsFor(inv: EffectiveInvoice, templateId: "vade" | "fatura" = "vade"): string {
  const t = TEMPLATES_START.find((x) => x.id === templateId) ?? TEMPLATES_START[0];
  const c = customer(inv.customerId);
  const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
  const dayName = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(parseDay(inv.due));
  const period = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(parseDay(inv.period));
  return t.body
    .replaceAll("{ad}", c.name)
    .replaceAll("{abone_no}", c.installation)
    .replaceAll("{donem}", period)
    .replaceAll("{tutar}", fmt.format(dueNow(inv).total / 100))
    .replaceAll("{son_odeme}", dayName);
}
export { TEMPLATE_SAMPLE };

/* ======================================================================== */
/* Banka satırı çözümü: alacak üretir                                        */
/* ======================================================================== */

export type LineChoice = "faturaya" | "avans" | "iade";

/**
 * Eşleşmeyen banka satırını çözer ve gereken ALACAĞI açar (İtirazlar ve Mahsup'ta
 * görünür): fazla ödeme ve mükerrer tutar alacak olur; "iade" alacağı hemen iade
 * edildi sayar; eksik tutar faturada açık kalır (alacak doğmaz).
 */
export function resolveBankLine(line: BankLine, how: LineChoice): { credit: ReturnType<typeof createCredit> | null; note: string } {
  if (!can("odeme")) {
    auditDenied("Banka satırı çözdü", line.reference);
    return { credit: null, note: "Yetkiniz yok." };
  }
  let credit: ReturnType<typeof createCredit> | null = null;
  const excess = Math.max(0, line.bankAmount - line.systemAmount);
  if (line.kind === "fazla" && excess > 0) {
    credit = createCredit(line.customerId, how === "avans" ? "avans" : "fazla-odeme", excess);
  } else if (line.kind === "mukerrer") {
    credit = createCredit(line.customerId, "cift-odeme", line.bankAmount);
  }
  if (credit && how === "iade") refundCredit(credit.id);
  resolveLine(line, how);
  audit("Banka satırını çözdü", line.reference, `Sistem ${line.systemAmount / 100} · Banka ${line.bankAmount / 100}`, `${how}${credit ? ` · ${credit.id}` : ""}`);
  const note = credit
    ? how === "iade"
      ? `${credit.id} alacağı açıldı ve iade talimatı verildi.`
      : `${credit.id} alacağı açıldı (${how === "avans" ? "avans" : "fazla ödeme"}); sonraki faturaya mahsup edilebilir.`
    : line.kind === "eksik"
      ? "Eksik tutar faturada açık bakiye olarak kaldı."
      : "Satır mutabık duruma geçti.";
  return { credit, note };
}

/* ======================================================================== */
/* CSV                                                                       */
/* ======================================================================== */

export function downloadCsv(name: string, header: readonly string[], rows: readonly (readonly (string | number)[])[]) {
  const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const text = "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { CURRENT_PERIOD, CUSTOMERS, TODAY, addDays, dayKey };
