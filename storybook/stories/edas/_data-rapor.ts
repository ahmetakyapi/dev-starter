/**
 * Raporlar sayfasının hesapları (saf, `Date.now` yok). Rapor oluşturucu pano ile
 * AYNI kaynaktan beslenir (`READINGS`, `INVOICES`, `regionLoss`, `OUTAGES`):
 * bölgeye göre kWh toplamı = `periodStats(...).usage`, bölgeye göre kayıp oranı
 * panodaki ile aynı. Rapor kataloğu, kayıtlı raporlar ve EPDK bildirimleri
 * KURGUSALDIR; kurum adı yalnız düzenleyici kurumu anar.
 */

import {
  CUSTOMERS,
  CUSTOMER_COUNT,
  INVOICES,
  KINDS,
  KIND_LABEL,
  METERS,
  OUTAGES,
  PERIODS_12,
  READINGS,
  REGIONS,
  SUBSTATIONS,
  SUPPLIERS,
  TODAY,
  TODAY_KEY,
  addDays,
  dayKey,
  outageMinutes,
  periodLabel,
  regionLoss,
  windowPeriods,
  type Customer,
} from "./_data";

/* --- Boyut, ölçü, dönem ----------------------------------------------------------- */

export type DimId = "region" | "substation" | "kind" | "tariff" | "supplier" | "voltage" | "month";
export const DIMS: readonly { value: DimId; label: string }[] = [
  { value: "region", label: "Bölge" },
  { value: "substation", label: "Trafo Merkezi" },
  { value: "kind", label: "Abone Tipi" },
  { value: "tariff", label: "Tarife (Tek / Çok Zamanlı)" },
  { value: "supplier", label: "Tedarikçi" },
  { value: "voltage", label: "Gerilim Seviyesi (AG / OG)" },
  { value: "month", label: "Ay (Eğilim)" },
];

export type MeasureKey = "kwh" | "billed" | "collected" | "rate" | "overdue" | "subs" | "loss" | "remote" | "flagged";
type Kind = "sum" | "ratio";
export type RMeasure = { value: MeasureKey; label: string; unit: "kWh" | "TL" | "%" | "abone" | "okuma"; kind: Kind; group: "Tüketim" | "Finans" | "Ölçüm" };
export const MEASURES_R: readonly RMeasure[] = [
  { value: "kwh", label: "Tüketim (kWh)", unit: "kWh", kind: "sum", group: "Tüketim" },
  { value: "loss", label: "Kayıp / Kaçak Oranı (%)", unit: "%", kind: "ratio", group: "Tüketim" },
  { value: "billed", label: "Tahakkuk (TL)", unit: "TL", kind: "sum", group: "Finans" },
  { value: "collected", label: "Tahsilat (TL)", unit: "TL", kind: "sum", group: "Finans" },
  { value: "rate", label: "Tahsilat Oranı (%)", unit: "%", kind: "ratio", group: "Finans" },
  { value: "overdue", label: "Geciken Alacak (TL)", unit: "TL", kind: "sum", group: "Finans" },
  { value: "subs", label: "Faturalanan Abone Sayısı", unit: "abone", kind: "sum", group: "Finans" },
  { value: "remote", label: "Uzaktan Okuma Payı (%)", unit: "%", kind: "ratio", group: "Ölçüm" },
  { value: "flagged", label: "Şüpheli Okuma Sayısı", unit: "okuma", kind: "sum", group: "Ölçüm" },
];
export const measureR = (key: MeasureKey) => MEASURES_R.find((m) => m.value === key)!;

export type PeriodKey = "1" | "3" | "6" | "12";
export const PERIOD_OPTIONS: readonly { value: PeriodKey; label: string }[] = [
  { value: "1", label: "Son Ay" },
  { value: "3", label: "Son 3 Ay" },
  { value: "6", label: "Son 6 Ay" },
  { value: "12", label: "Son 11 Dönem" },
];
/** Tamamlanmış tam dönemler (güncel dönem hariç: okumalar sürüyor). */
export const periodsFor = (key: PeriodKey): string[] => (key === "12" ? PERIODS_12.slice(0, 11) : windowPeriods(key));

export type Filters = { region: string; kind: string; voltage: string };
export const NO_FILTER: Filters = { region: "hepsi", kind: "hepsi", voltage: "hepsi" };

/** Ölçü, bu boyutta hesaplanabilir mi (kayıp oranı yalnız bölge ya da ay için). */
export const measureAllowed = (measure: MeasureKey, dim: DimId) => (measure === "loss" ? dim === "region" || dim === "month" : true);

/* --- Toplama ------------------------------------------------------------------------ */

const CUSTOMER_MAP = new Map(CUSTOMERS.map((c) => [c.id, c]));
const SUBSTATION_OF = new Map<string, string>();
for (const m of METERS) if (!SUBSTATION_OF.has(m.customerId)) SUBSTATION_OF.set(m.customerId, m.substationId);
const SUPPLIER_NAME = new Map(SUPPLIERS.map((s) => [s.id, s.name]));
const SUBSTATION_NAME = new Map(SUBSTATIONS.map((s) => [s.id, s.name]));
const REGION_NAME = new Map(REGIONS.map((r) => [r.id, r.name]));

const passes = (c: Customer, f: Filters) => (f.region === "hepsi" || c.regionId === f.region) && (f.kind === "hepsi" || c.kind === f.kind) && (f.voltage === "hepsi" || c.voltage === f.voltage);

const labelOf = (dim: DimId, c: Customer, period: string): string => {
  switch (dim) {
    case "region":
      return REGION_NAME.get(c.regionId) ?? c.regionId;
    case "substation":
      return SUBSTATION_NAME.get(SUBSTATION_OF.get(c.id) ?? "") ?? "Bilinmiyor";
    case "kind":
      return KIND_LABEL[c.kind];
    case "tariff":
      return c.tariff === "cok-zamanli" ? "Çok Zamanlı" : "Tek Zamanlı";
    case "supplier":
      return SUPPLIER_NAME.get(c.supplierId) ?? c.supplierId;
    case "voltage":
      return c.voltage === "OG" ? "Orta Gerilim (OG)" : "Alçak Gerilim (AG)";
    default:
      return periodLabel(period);
  }
};

export type ReportRow = { label: string; value: number; num: number; den: number; share: number };
export type ReportResult = { rows: ReportRow[]; total: number; totalNum: number; totalDen: number };

/** Boyut × ölçü × dönem × süzgeç: hepsi tek geçişte. */
export function aggregate(dim: DimId, measure: MeasureKey, periods: readonly string[], filters: Filters): ReportResult {
  const m = measureR(measure);
  const groups = new Map<string, { num: number; den: number; subs: Set<string> }>();
  const slot = (label: string) => {
    let g = groups.get(label);
    if (!g) {
      g = { num: 0, den: 0, subs: new Set() };
      groups.set(label, g);
    }
    return g;
  };
  const inPeriods = new Set(periods);

  if (measure === "loss") {
    for (const p of periods) {
      for (const row of regionLoss(p)) {
        if (filters.region !== "hepsi" && row.region.id !== filters.region) continue;
        const g = slot(dim === "month" ? periodLabel(p) : row.region.name);
        g.num += row.lossKwh;
        g.den += row.input;
      }
    }
  } else if (measure === "kwh" || measure === "remote" || measure === "flagged") {
    for (const r of READINGS) {
      if (!inPeriods.has(r.period) || r.status === "bekliyor") continue;
      const c = CUSTOMER_MAP.get(r.customerId);
      if (!c || !passes(c, filters)) continue;
      const g = slot(labelOf(dim, c, r.period));
      if (measure === "kwh") g.num += r.usage.total;
      else if (measure === "remote") {
        g.num += r.source === "uzaktan" ? 1 : 0;
        g.den += 1;
      } else g.num += r.status === "supheli" ? 1 : 0;
    }
  } else {
    for (const i of INVOICES) {
      if (!inPeriods.has(i.period)) continue;
      const c = CUSTOMER_MAP.get(i.customerId);
      if (!c || !passes(c, filters)) continue;
      const g = slot(labelOf(dim, c, i.period));
      const matured = i.due < TODAY_KEY;
      if (measure === "billed") g.num += i.total / 100;
      else if (measure === "collected") g.num += i.paid / 100;
      else if (measure === "rate") {
        if (matured) {
          g.num += i.paid;
          g.den += i.total;
        }
      } else if (measure === "overdue") {
        if (i.status === "gecikti" || (i.status === "kismi" && matured)) g.num += (i.total - i.paid) / 100;
      } else g.subs.add(i.customerId);
    }
  }

  let rows: ReportRow[] = [...groups.entries()].map(([label, g]) => {
    const num = measure === "subs" ? g.subs.size : g.num;
    const value = m.kind === "ratio" ? (g.den ? Math.round((num / g.den) * 1000) / 10 : 0) : Math.round(num * 100) / 100;
    return { label, value, num, den: g.den, share: 0 };
  });
  const totalNum = rows.reduce((s, r) => s + r.num, 0);
  const totalDen = rows.reduce((s, r) => s + r.den, 0);
  const total = m.kind === "ratio" ? (totalDen ? Math.round((totalNum / totalDen) * 1000) / 10 : 0) : Math.round(totalNum * 100) / 100;
  rows = rows.map((r) => ({ ...r, share: m.kind === "sum" && totalNum ? (r.num / totalNum) * 100 : 0 }));
  if (dim === "month") {
    const order = periods.map(periodLabel);
    rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  } else if (dim === "kind") {
    const order = KINDS.map((k) => KIND_LABEL[k]);
    rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  } else rows.sort((a, b) => b.value - a.value);
  return { rows, total, totalNum, totalDen };
}

export const formatValue = (measure: MeasureKey, value: number) => {
  const m = measureR(measure);
  if (m.unit === "TL") return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
  if (m.unit === "%") return `%${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}`;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)}${m.unit === "kWh" ? " kWh" : ""}`;
};

/* --- SAIDI / SAIFI --------------------------------------------------------------------- */

/** Plansız kesintiler: SAIFI = etkilenen abone / toplam abone, SAIDI = abone·dakika / toplam abone. */
export function reliability(days: number) {
  const from = addDays(TODAY, -days).getTime();
  const rows = OUTAGES.filter((o) => o.kind === "plansiz" && o.start.getTime() >= from && o.start <= TODAY);
  const saifi = rows.reduce((s, o) => s + o.affected, 0) / CUSTOMER_COUNT;
  const saidi = rows.reduce((s, o) => s + o.affected * outageMinutes(o), 0) / CUSTOMER_COUNT;
  return { events: rows.length, saifi: Math.round(saifi * 100) / 100, saidi: Math.round(saidi * 10) / 10 };
}

/* --- Rapor kataloğu ---------------------------------------------------------------------- */

export type CategoryId = "tuketim" | "tahsilat" | "kayip" | "okuma" | "kesinti" | "musteri" | "tedarikci";
export const CATEGORIES: readonly { id: CategoryId; label: string; hint: string }[] = [
  { id: "tuketim", label: "Tüketim", hint: "Enerji miktarı ve dağılımı" },
  { id: "tahsilat", label: "Tahsilat", hint: "Tahakkuk, tahsilat ve alacak" },
  { id: "kayip", label: "Kayıp ve Kaçak", hint: "Bölge ve trafo bazında" },
  { id: "okuma", label: "Okuma Performansı", hint: "Uzaktan okuma ve şüpheli kayıtlar" },
  { id: "kesinti", label: "Arıza ve Kesinti", hint: "SAIDI, SAIFI ve olay sayısı" },
  { id: "musteri", label: "Müşteri", hint: "Abone yapısı ve segment" },
  { id: "tedarikci", label: "Tedarikçi", hint: "Tedarikçi bazında hacim ve alacak" },
];

export type Preset = { id: string; category: CategoryId; title: string; description: string; dim: DimId; measure: MeasureKey; period: PeriodKey; cadence: string; formats: string };
export const PRESETS: readonly Preset[] = [
  { id: "tuketim-bolge", category: "tuketim", title: "Bölgeye Göre Aylık Tüketim", description: "Altı bölgenin dönem tüketimi ve payı.", dim: "region", measure: "kwh", period: "1", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "tuketim-tip", category: "tuketim", title: "Abone Tipine Göre Tüketim", description: "Konut, ticarethane, sanayi ve tarımsal sulama.", dim: "kind", measure: "kwh", period: "3", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "tuketim-trend", category: "tuketim", title: "Tüketim Eğilimi", description: "Son on bir dönemde aylık toplam tüketim.", dim: "month", measure: "kwh", period: "12", cadence: "Aylık", formats: "Excel, CSV" },
  { id: "tahsilat-ozet", category: "tahsilat", title: "Tahakkuk ve Tahsilat Özeti", description: "Bölgeye göre tahakkuk edilen tutar.", dim: "region", measure: "billed", period: "1", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "tahsilat-oran", category: "tahsilat", title: "Tahsilat Oranı Eğilimi", description: "Vadesi gelmiş faturalarda aylık tahsilat oranı.", dim: "month", measure: "rate", period: "12", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "tahsilat-alacak", category: "tahsilat", title: "Geciken Alacak", description: "Abone tipine göre vadesi geçmiş açık bakiye.", dim: "kind", measure: "overdue", period: "6", cadence: "Haftalık", formats: "Excel, CSV" },
  { id: "kayip-bolge", category: "kayip", title: "Bölgeye Göre Kayıp ve Kaçak", description: "Hedefe göre sapma, bölge bazında.", dim: "region", measure: "loss", period: "1", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "kayip-trend", category: "kayip", title: "Kayıp Oranı Eğilimi", description: "Şebeke geneli aylık kayıp ve kaçak oranı.", dim: "month", measure: "loss", period: "12", cadence: "Aylık", formats: "PDF" },
  { id: "okuma-uzaktan", category: "okuma", title: "Uzaktan Okuma Payı", description: "Bölgeye göre uzaktan okunan sayaç oranı.", dim: "region", measure: "remote", period: "3", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "okuma-supheli", category: "okuma", title: "Şüpheli Okuma Dağılımı", description: "Trafo merkezine göre işaretli okumalar.", dim: "substation", measure: "flagged", period: "6", cadence: "Haftalık", formats: "Excel, CSV" },
  { id: "kesinti-bolge", category: "kesinti", title: "Kesinti Göstergeleri (SAIDI, SAIFI)", description: "Plansız kesintilerde abone başına süre ve sıklık.", dim: "region", measure: "subs", period: "1", cadence: "Çeyreklik", formats: "PDF" },
  { id: "musteri-segment", category: "musteri", title: "Müşteri Yapısı", description: "Gerilim seviyesine göre faturalanan abone sayısı.", dim: "voltage", measure: "subs", period: "1", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "musteri-tarife", category: "musteri", title: "Tarife Dağılımı", description: "Tek ve çok zamanlı abonelerin tüketim payı.", dim: "tariff", measure: "kwh", period: "3", cadence: "Aylık", formats: "Excel" },
  { id: "tedarikci-hacim", category: "tedarikci", title: "Tedarikçiye Göre Tüketim", description: "Her tedarikçinin portföy tüketimi.", dim: "supplier", measure: "kwh", period: "3", cadence: "Aylık", formats: "PDF, Excel" },
  { id: "tedarikci-alacak", category: "tedarikci", title: "Tedarikçiye Göre Geciken Alacak", description: "Tedarikçi portföyündeki açık bakiye.", dim: "supplier", measure: "overdue", period: "6", cadence: "Haftalık", formats: "Excel, CSV" },
];
export const presetOf = (id: string | undefined) => PRESETS.find((p) => p.id === id);

/* --- Kayıtlı raporlar -------------------------------------------------------------------------- */

export type Cadence = "gunluk" | "haftalik" | "aylik" | "yok";
export const CADENCE_LABEL: Record<Cadence, string> = { gunluk: "Her Gün 07:30", haftalik: "Her Pazartesi 08:00", aylik: "Ayın 1'i 06:00", yok: "Zamanlanmamış" };
export type RunStatus = "basarili" | "hata" | "bekliyor";
export type SavedReport = {
  id: string;
  name: string;
  owner: string;
  presetId: string;
  dim: DimId;
  measure: MeasureKey;
  period: PeriodKey;
  cadence: Cadence;
  format: "pdf" | "xlsx" | "csv";
  recipients: string;
  /** Son çalışma, `YYYY-MM-DD HH:mm`. */
  lastRun: string | null;
  status: RunStatus;
  paused: boolean;
};

export const SEED_REPORTS: readonly SavedReport[] = [
  { id: "sr-1", name: "Aylık Bölge Tüketimi", owner: "Aylin Yıldırım", presetId: "tuketim-bolge", dim: "region", measure: "kwh", period: "1", cadence: "aylik", format: "pdf", recipients: "yonetim@kuzeyova-dagitim.example", lastRun: "2026-11-01 06:00", status: "basarili", paused: false },
  { id: "sr-2", name: "Haftalık Geciken Alacak", owner: "Dilek Yurt", presetId: "tahsilat-alacak", dim: "kind", measure: "overdue", period: "6", cadence: "haftalik", format: "xlsx", recipients: "tahsilat@kuzeyova-dagitim.example", lastRun: "2026-11-16 08:00", status: "basarili", paused: false },
  { id: "sr-3", name: "Günlük Şüpheli Okuma", owner: "Kerem Aydoğan", presetId: "okuma-supheli", dim: "substation", measure: "flagged", period: "1", cadence: "gunluk", format: "csv", recipients: "olcum@kuzeyova-dagitim.example", lastRun: "2026-11-21 07:30", status: "basarili", paused: false },
  { id: "sr-4", name: "Kayıp Kaçak Eğilimi", owner: "Aylin Yıldırım", presetId: "kayip-trend", dim: "month", measure: "loss", period: "12", cadence: "aylik", format: "pdf", recipients: "yonetim@kuzeyova-dagitim.example", lastRun: "2026-11-01 06:00", status: "hata", paused: false },
  { id: "sr-5", name: "Tedarikçi Hacim Raporu", owner: "Selin Karataş", presetId: "tedarikci-hacim", dim: "supplier", measure: "kwh", period: "3", cadence: "yok", format: "pdf", recipients: "", lastRun: "2026-10-28 14:12", status: "basarili", paused: false },
  { id: "sr-6", name: "Uzaktan Okuma Takibi", owner: "Kerem Aydoğan", presetId: "okuma-uzaktan", dim: "region", measure: "remote", period: "3", cadence: "haftalik", format: "pdf", recipients: "olcum@kuzeyova-dagitim.example", lastRun: "2026-11-09 08:00", status: "bekliyor", paused: true },
];

/** Bir sonraki çalışma: bugünden sonraki ilk uygun tarih ve saat (ISO + kısa metinler). */
export function nextRun(cadence: Cadence): { at: string; time: string; day: string } | null {
  if (cadence === "yok") return null;
  const dayName = new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric" });
  const make = (d: Date, hh: number, mm: number) => ({
    at: `${dayKey(d)}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    day: dayKey(d) === dayKey(addDays(TODAY, 1)) ? "Yarın" : dayName.format(d),
  });
  if (cadence === "gunluk") return make(addDays(TODAY, 1), 7, 30);
  if (cadence === "haftalik") {
    const d = addDays(TODAY, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    return make(d, 8, 0);
  }
  return make(new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1), 6, 0);
}

/* --- EPDK bildirimleri ------------------------------------------------------------------------- */

export type FilingStatus = "hazirlaniyor" | "hazir" | "gonderildi" | "gecikti";
export const FILING_LABEL: Record<FilingStatus, string> = { hazirlaniyor: "Hazırlanıyor", hazir: "Gönderime Hazır", gonderildi: "Gönderildi", gecikti: "Süresi Geçti" };
export type Filing = {
  id: string;
  title: string;
  period: string;
  deadline: string;
  status: FilingStatus;
  presetId: string;
  /** Gönderim öncesi doğrulamalar. */
  checks: readonly { label: string; ok: boolean }[];
  reference?: string;
};

export const SEED_FILINGS: readonly Filing[] = [
  {
    id: "f-1",
    title: "Aylık Kayıp ve Kaçak Bildirimi",
    period: "Ekim 2026",
    deadline: "2026-11-25",
    status: "hazir",
    presetId: "kayip-bolge",
    checks: [
      { label: "Bütün bölgelerin girişi ve faturalanan enerjisi dolu", ok: true },
      { label: "Okuması bekleyen sayaç yok (dönem kapandı)", ok: true },
      { label: "Bölge toplamı şebeke girişiyle uyumlu", ok: true },
    ],
  },
  {
    id: "f-2",
    title: "Kesinti Göstergeleri (SAIDI ve SAIFI), Çeyreklik",
    period: "2026 Üçüncü Çeyrek",
    deadline: "2026-11-30",
    status: "hazirlaniyor",
    presetId: "kesinti-bolge",
    checks: [
      { label: "Bütün plansız kesintilerin bitiş saati kayıtlı", ok: true },
      { label: "Etkilenen abone sayıları trafo merkezine bağlı", ok: false },
      { label: "Mücbir sebep kayıtları ayrıldı", ok: false },
    ],
  },
  {
    id: "f-3",
    title: "Tahsilat ve Alacak Bildirimi",
    period: "Ekim 2026",
    deadline: "2026-11-20",
    status: "gecikti",
    presetId: "tahsilat-alacak",
    checks: [
      { label: "Tahsilat mutabakatı tamam", ok: false },
      { label: "Gecikme zammı hesapları kapandı", ok: true },
    ],
  },
  {
    id: "f-4",
    title: "Sayaç Değişim ve Bakım Bildirimi",
    period: "Ekim 2026",
    deadline: "2026-11-15",
    status: "gonderildi",
    presetId: "okuma-supheli",
    checks: [
      { label: "Sökülen ve takılan sayaç eşleşti", ok: true },
      { label: "Kalibrasyon belgeleri yüklü", ok: true },
    ],
    reference: "BLD-2026-110482",
  },
  {
    id: "f-5",
    title: "Ticari Kalite Göstergeleri",
    period: "2026 Üçüncü Çeyrek",
    deadline: "2026-12-10",
    status: "hazirlaniyor",
    presetId: "musteri-segment",
    checks: [
      { label: "Bağlantı ve müşteri talebi süreleri hesaplandı", ok: true },
      { label: "Aydınlatma ve enerji kalitesi şikayetleri eklendi", ok: false },
    ],
  },
];
