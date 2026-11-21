import { useDerived } from "./_core";
import {
  CURRENT_PERIOD,
  PERIODS_12,
  TODAY_KEY,
  METERS,
  TRANSFORMERS,
  collectionIn,
  daysBetween,
  parseDay,
  periodStats,
  TODAY,
  type Customer,
  type Invoice,
  type Period,
  type Reading,
  type Outage,
} from "./_data";
import { allInvoices, getFinance, isOverdue, type EffectiveInvoice } from "./_data-finans";
import { accountOf, allCustomers, isRisky } from "./_data-musteri";
import { effectiveMeters, effectiveOutages, effectiveReadings } from "./_ops";
import { TRANSFORMER_LOADS } from "./_data-yeni";
import { getApprovals } from "./_permissions";
import { getApplications, getCalls, getCredits, getDataRequests, getDisputes, getLeaks, getStock, getWorkOrders, getNotifications } from "./_store";
import { reconnectSla } from "./_cutpolicy";

/**
 * Edaş Portalı'nda GÖRÜNEN her türetilmiş sayı buradan okunur: kenar çubuğu
 * rozetleri, komut paleti ipuçları, pano karoları, müşteri bakiyesi, rapor
 * toplamları. Sayfalar kendi `.filter(...)` sayımını YAZMAZ; böylece bir faturaya
 * ödeme girilince bütün ekranlar aynı anda tutarlı güncellenir.
 *
 * İşlevler saftır (o anki depo durumunu okur); `use*` kancaları depo her
 * değiştiğinde yeniden hesaplar (`useDerived`).
 */

/* --- Faturalar, tahsilat -------------------------------------------------- */

export const liveInvoices = (): EffectiveInvoice[] => allInvoices(getFinance());
export const overdueInvoices = (): EffectiveInvoice[] => liveInvoices().filter(isOverdue);
export const overdueTotal = () => overdueInvoices().reduce((s, i) => s + (i.total - i.paid), 0);
/** Aktif (iptal edilmemiş) faturalar. */
export const activeInvoices = (): EffectiveInvoice[] => liveInvoices().filter((i) => !i.cancelled);

/** Tahsilat oranı kapsamı: etiket olmadan iki farklı yüzde karışır (Pano ve Ödemeler). */
export const COLLECTION_SCOPE = "Vadesi gelmiş faturalarda, seçili dönem penceresi";
export const collectionRate = (period: string) => collectionIn(period, activeInvoices() as Invoice[]);

/* --- Okumalar, sayaçlar, arızalar --------------------------------------------- */

export const flaggedReadings = (period?: string): Reading[] => effectiveReadings().filter((r) => r.status === "supheli" && (!period || r.period === period));
export const pendingReadings = (period: string = CURRENT_PERIOD): Reading[] => effectiveReadings().filter((r) => r.status === "bekliyor" && r.period === period);
export const openOutages = (): Outage[] => effectiveOutages().filter((o) => o.status === "acik");
export const unreadableMeters = () => effectiveMeters().filter((m) => m.status === "iletisim-yok" || m.status === "arizali");
export const commsLostMeters = () => effectiveMeters().filter((m) => m.status === "iletisim-yok");

/* --- Müşteriler ----------------------------------------------------------------- */

export const activeCustomers = (): Customer[] => allCustomers().filter((c) => c.status === "aktif");
export const riskyCustomers = (): Customer[] => allCustomers().filter(isRisky);
export const customerBalance = (customerId: string) => accountOf(customerId).balance;

/* --- Pano ------------------------------------------------------------------------ */

export function liveStats(period: Period) {
  return periodStats(period, { invoices: activeInvoices() as Invoice[], customers: allCustomers(), openOutages: openOutages().length, unreadable: unreadableMeters().length });
}

/* --- Yeni modüller ------------------------------------------------------------------ */

export const pendingApprovals = () => getApprovals().filter((a) => a.status === "bekliyor");
export const openWorkOrders = () => getWorkOrders().filter((w) => w.status !== "tamamlandi" && w.status !== "iptal");
export const workOrderSlaBreaches = () => openWorkOrders().filter((w) => reconnectSlaFor(w.createdAt, w.slaHours));
const reconnectSlaFor = (createdAt: Date, slaHours: number) => (TODAY.getTime() - createdAt.getTime()) / 3_600_000 > slaHours;
export const reconnectBreaches = () => getWorkOrders().filter((w) => w.type === "baglama" && w.status !== "tamamlandi" && w.status !== "iptal" && reconnectSla(w.createdAt).breached);

export const openCalls = () => getCalls().filter((c) => c.status !== "kapandi");
/** Aynı DTR'ye üç ya da daha çok açık arıza çağrısı gelmiş ve henüz arızaya bağlanmamış: arıza adayı. */
export function faultCandidates() {
  const by = new Map<string, number>();
  for (const c of getCalls()) if (c.kind === "ariza" && c.status === "acik" && !c.outageId && c.transformerId) by.set(c.transformerId, (by.get(c.transformerId) ?? 0) + 1);
  return [...by.entries()].filter(([, n]) => n >= 3).map(([transformerId, count]) => ({ transformerId, count, transformer: TRANSFORMERS.find((t) => t.id === transformerId)! }));
}
export const overloadedTransformers = (limitPct = 90) => TRANSFORMER_LOADS.filter((t) => t.loadPct >= limitPct);

export const openLeaks = () => getLeaks().filter((l) => l.stage !== "kapandi");
export const openLeakAmount = () => openLeaks().filter((l) => l.stage === "bedel" || l.stage === "itiraz").reduce((s, l) => s + l.amount, 0);
export const applicationsOpen = () => getApplications().filter((a) => a.stage !== "tamam" && a.stage !== "red");
export const stockCounts = () => {
  const counts = { stokta: 0, tahsisli: 0, sokulmus: 0, muayenede: 0, hurda: 0 };
  for (const s of getStock()) counts[s.status] += 1;
  return counts;
};
/** Muayene tarihi geçmiş (tahsisli ya da stokta) sayaçlar. */
export const inspectionOverdue = () => getStock().filter((s) => (s.status === "stokta" || s.status === "tahsisli") && s.inspectionDue < TODAY_KEY);
export const openDisputes = () => getDisputes().filter((d) => d.status !== "kapandi");
export const disputeSlaBreaches = () => openDisputes().filter((d) => d.dueAt < TODAY_KEY);
export const openCredits = () => getCredits().filter((c) => c.status === "acik");
export const openCreditTotal = () => openCredits().reduce((s, c) => s + c.amount, 0);
export const dataRequestsDue = () => getDataRequests().filter((r) => r.status !== "tamam" && daysBetween(TODAY, parseDay(r.dueAt)) <= 5);
export const unreadNotifications = () => getNotifications().filter((n) => !n.read);

/* --- Kenar çubuğu rozetleri ve komut paleti ---------------------------------------- */

export type Badges = {
  readings: number;
  invoices: number;
  outages: number;
  calls: number;
  leaks: number;
  applications: number;
  disputes: number;
  compliance: number;
  workorders: number;
};
export function badges(): Badges {
  return {
    readings: flaggedReadings(CURRENT_PERIOD).length,
    invoices: overdueInvoices().length,
    outages: openOutages().length,
    calls: openCalls().length,
    leaks: openLeaks().length,
    applications: applicationsOpen().length,
    disputes: openDisputes().length,
    compliance: pendingApprovals().length + dataRequestsDue().length,
    workorders: openWorkOrders().length,
  };
}

/* --- Kancalar ---------------------------------------------------------------------- */

export const useBadges = () => useDerived(badges);
export const useLiveStats = (period: Period) => useDerived(() => liveStats(period), [period]);
export const useOverdueInvoices = () => useDerived(overdueInvoices);
export const useOpenOutages = () => useDerived(openOutages);
export const useFlaggedReadings = (period?: string) => useDerived(() => flaggedReadings(period), [period]);
export const useCollectionRate = (period: string) => useDerived(() => collectionRate(period), [period]);
export const useCustomerBalance = (customerId: string) => useDerived(() => customerBalance(customerId), [customerId]);
export const useRiskyCount = () => useDerived(() => riskyCustomers().length);

export { PERIODS_12, METERS };
