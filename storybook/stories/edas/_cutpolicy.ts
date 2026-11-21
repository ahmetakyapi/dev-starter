import { createSlice } from "./_core";
import { SAMPLE_HOLIDAYS, addBusinessDays, inWorkHours, isBusinessDay, nextBusinessDay } from "./_calendar";
import { TODAY_KEY, daysBetween, parseDay, TODAY } from "./_data";
import { accountOf, findCustomer } from "./_data-musteri";
import { allInvoices, getFinance, isOverdue } from "./_data-finans";

/**
 * Kesme ve bağlama politikası. Bütün süreler ve takvim PARAMETREDİR (Ayarlar →
 * Kesme Politikası); değerler ÖRNEKTİR: gerçek mevzuattaki ihtar ve bekleme süreleri,
 * mesai saatleri ve hassas abone tanımı DOĞRULANMADI (bkz. `_billing.ts`).
 *
 * Akış: hatırlatma → ihtar (yazılı bildirim, tarihi kayıtlı) → bekleme süresi dolar
 * → kesme emri (iş emri, iş günü ve mesaiye oturur) → enerji kesilir →
 * ödeme/plan → bağlama emri (SLA sayaçlı). Hassas abone, açık itiraz ve aktif ödeme
 * planı kesme listesine GİRMEZ.
 */

export type CutPolicyParams = {
  holidays: readonly string[];
  workStart: number;
  workEnd: number;
  /** Gecikme gününden sonra hatırlatma, ihtar eşikleri. */
  remindAfterDays: number;
  noticeAfterDays: number;
  /** İhtar tebliğinden kesme emrine kadar en az iş günü. */
  waitBusinessDays: number;
  /** Bağlama talebinden enerjilendirmeye hedef süre (saat). */
  reconnectSlaHours: number;
  /** Kesme listesinden muaf etiketler. */
  exemptTags: readonly string[];
};

export const DEFAULT_CUT_POLICY: CutPolicyParams = {
  holidays: SAMPLE_HOLIDAYS,
  workStart: 8,
  workEnd: 17,
  remindAfterDays: 1,
  noticeAfterDays: 15,
  waitBusinessDays: 5,
  reconnectSlaHours: 24,
  exemptTags: ["Hassas Abone (Tıbbi Cihaz)"],
};

const policy = createSlice<CutPolicyParams>(DEFAULT_CUT_POLICY);
export const useCutPolicy = () => policy.use();
export const getCutPolicy = () => policy.get();
export const setCutPolicy = (patch: Partial<CutPolicyParams>) => policy.set((p) => ({ ...p, ...patch }));

/** İhtar tebliğ tarihleri (müşteri kimliği → `YYYY-MM-DD`). */
/**
 * Tohum: gecikmesi uzun, hassas olmayan ilk 14 abonenin ihtarı 14 gün önce
 * tebliğ edilmiş sayılır; böylece demoda bekleme süresi dolmuş adaylar vardır.
 */
function seedNotices(): Record<string, string> {
  const day = new Date(TODAY.getTime() - 14 * 86_400_000);
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  const out: Record<string, string> = {};
  for (const inv of allInvoices(getFinance())) {
    if (Object.keys(out).length >= 14) break;
    if (!isOverdue(inv) || out[inv.customerId]) continue;
    if (daysBetween(parseDay(inv.due), TODAY) < 30) continue;
    const c = findCustomer(inv.customerId);
    if (!c || c.status !== "aktif" || (c.tags ?? []).some((tag) => tag.startsWith("Hassas"))) continue;
    out[inv.customerId] = key;
  }
  return out;
}
const notices = createSlice<Readonly<Record<string, string>>>(seedNotices());
export const useNotices = () => notices.use();
export const getNotices = () => notices.get();
export const markNotice = (customerId: string, key: string = TODAY_KEY) => notices.set((n) => ({ ...n, [customerId]: key }));

export type CutEligibility = {
  eligible: boolean;
  /** Neden kesilemez (boşsa kesilebilir). */
  blockers: string[];
  /** Uyarılar (kesmeyi engellemez). */
  warnings: string[];
  overdueDays: number;
  noticeAt: string | null;
  /** İhtar + bekleme süresinden sonraki en erken kesme günü. */
  earliest: string | null;
};

/** Bir müşterinin kesme listesine girip giremeyeceği, nedenleriyle. */
export function cutEligibility(customerId: string): CutEligibility {
  const p = policy.get();
  const c = findCustomer(customerId);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const fin = getFinance();
  const overdue = c ? allInvoices(fin).filter((i) => i.customerId === customerId && isOverdue(i)) : [];
  const oldest = overdue.reduce<string | null>((min, i) => (min === null || i.due < min ? i.due : min), null);
  const overdueDays = oldest ? Math.max(0, daysBetween(parseDay(oldest), TODAY)) : 0;
  if (!c) blockers.push("Müşteri bulunamadı");
  if (c) {
    if (c.status === "kesik") blockers.push("Enerjisi zaten kesik");
    if (c.status === "kapali") blockers.push("Abonelik kapalı");
    const tag = (c.tags ?? []).find((t) => p.exemptTags.includes(t));
    if (tag) blockers.push(`${tag}: kesme listesine alınmaz`);
    if (allInvoices(fin).some((i) => i.customerId === customerId && i.status === "itirazli" && !i.cancelled)) blockers.push("Açık fatura itirazı var");
    if (fin.plans.some((x) => x.customerId === customerId && x.status === "devam")) blockers.push("Aktif ödeme planı var");
    if (overdueDays < p.noticeAfterDays) blockers.push(`Gecikme ${p.noticeAfterDays} günden az (${overdueDays} gün)`);
    if (accountOf(customerId).balance <= 0) blockers.push("Açık bakiye yok");
  }
  const noticeAt = notices.get()[customerId] ?? null;
  const earliest = noticeAt ? addBusinessDays(noticeAt, p.waitBusinessDays, p.holidays) : null;
  if (!noticeAt) blockers.push("Yazılı ihtar yapılmadı");
  else if (earliest && earliest > TODAY_KEY) blockers.push(`İhtar bekleme süresi ${earliest} tarihine dek sürüyor`);
  if (!isBusinessDay(TODAY_KEY, p.holidays)) warnings.push("Bugün iş günü değil: emir sonraki iş gününe planlanır");
  return { eligible: blockers.length === 0, blockers, warnings, overdueDays, noticeAt, earliest };
}

/** Kesme/bağlama emrinin planlı zamanı: iş günü ve mesai içi. `dayKey` yoksa bugünden/yarından. */
export function scheduleSlot(dayKey: string = TODAY_KEY, hour = 9): Date {
  const p = policy.get();
  let key = nextBusinessDay(dayKey, p.holidays);
  let h = Math.min(Math.max(hour, p.workStart), p.workEnd - 1);
  if (key === TODAY_KEY && h <= TODAY.getHours()) {
    key = nextBusinessDay(addBusinessDays(TODAY_KEY, 1, p.holidays), p.holidays);
    h = p.workStart + 1;
  }
  const d = parseDay(key);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), inWorkHours(h, p.workStart, p.workEnd) ? h : p.workStart + 1, 0);
}

/** Bağlama SLA'sı: talepten bu yana geçen saat ve hedefe kalan. */
export function reconnectSla(createdAt: Date, now: Date = TODAY) {
  const p = policy.get();
  const hours = Math.round(((now.getTime() - createdAt.getTime()) / 3_600_000) * 10) / 10;
  return { hours, targetHours: p.reconnectSlaHours, breached: hours > p.reconnectSlaHours, remaining: Math.round((p.reconnectSlaHours - hours) * 10) / 10 };
}
