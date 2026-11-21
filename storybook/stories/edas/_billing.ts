/**
 * Fatura hesap çekirdeği: TEK yer. Üreteç, tahakkuk taslağı, tedarikçi teklif
 * karşılaştırması ve gecikme zammı hep buradan hesaplanır.
 *
 * ÖNEMLİ: Bu dosyadaki oran, eşik ve fiyatların HİÇBİRİ gerçek mevzuat sayısı
 * değildir; "ÖRNEK PARAMETRE"dir ve Ayarlar → Tarifeler'den değişir. Bu demonun
 * hazırlanmasında mevzuat bilgisi ezberden yazıldı ve DOĞRULANMADI; gerçek bir
 * üründe her parametre güncel düzenleyici kurul kararı ve vergi mevzuatından
 * teyit edilmeli (zaman dilimi saatleri, reaktif sınırları, hangi abone
 * sınıflarına uygulandığı, fon ve vergi oranları, gecikme zammı).
 *
 * Para kuruş (tam sayı). Bu dosya `_data.ts`'ten çalışma zamanında bir şey almaz
 * (döngü olmasın); tipler yalnız tür olarak içe aktarılır.
 */

export type BillingKind = "bireysel" | "ticari" | "sanayi" | "tarim";

/** Ayarlar → Tarifeler'de düzenlenen parametre kümesi (hepsi ÖRNEK). */
export type BillingParams = {
  /** Dağıtım bedeli, TL/kWh (kullanıcı sınıfına göre). */
  distribution: Record<BillingKind, number>;
  /** İletim (sistem kullanım) bedeli, TL/kWh. Faturada dağıtım kaleminin içinde gösterilir. */
  transmission: number;
  /** YEKDEM, TL/kWh. */
  yekdem: number;
  /** Fon payı: enerji bedelinin yüzdesi. */
  fundPct: Record<BillingKind, number>;
  /** Belediye tüketim vergisi: (enerji + dağıtım) yüzdesi. */
  btvPct: Record<BillingKind, number>;
  /** KDV yüzdesi. */
  vatPct: Record<BillingKind, number>;
  /** Çok zamanlı tarifede dilim fiyat çarpanları (T1 = 1). */
  zoneMultiplier: { t1: number; t2: number; t3: number };
  /** Zaman dilimi saatleri (yalnız bilgi; okuma dilimlere göre gelir). */
  zoneHours: { t1: string; t2: string; t3: string };
  /** Reaktif sınırlar: aktife oran. */
  reactiveInductiveLimit: number;
  reactiveCapacitiveLimit: number;
  /** Aşan reaktif için birim bedel, TL/kVArh. */
  reactiveRate: number;
  /** Reaktif bedel hangi sınıflara uygulanır (konut muaf). */
  reactiveKinds: readonly BillingKind[];
  /** Sözleşme gücü aşım bedeli, TL/kW. */
  powerOverRate: number;
};

export const DEFAULT_PARAMS: BillingParams = {
  distribution: { bireysel: 0.79, ticari: 0.66, sanayi: 0.31, tarim: 0.4 },
  transmission: 0.05,
  yekdem: 0.06,
  fundPct: { bireysel: 3, ticari: 1, sanayi: 1, tarim: 1 },
  btvPct: { bireysel: 5, ticari: 5, sanayi: 1, tarim: 0 },
  vatPct: { bireysel: 20, ticari: 20, sanayi: 20, tarim: 10 },
  zoneMultiplier: { t1: 1, t2: 1.42, t3: 0.62 },
  zoneHours: { t1: "06:00-17:00", t2: "17:00-22:00", t3: "22:00-06:00" },
  reactiveInductiveLimit: 0.2,
  reactiveCapacitiveLimit: 0.15,
  reactiveRate: 0.9,
  reactiveKinds: ["ticari", "sanayi", "tarim"],
  powerOverRate: 120,
};

/** Gecikme zammı oran tablosu: yürürlük tarihine göre aylık yüzde (ÖRNEK). */
export type LateRateRow = { from: string; monthlyPct: number };
export const DEFAULT_LATE_RATES: readonly LateRateRow[] = [
  { from: "2020-01-01", monthlyPct: 1.6 },
  { from: "2024-01-01", monthlyPct: 2.5 },
];

const DAY = 86_400_000;
const dayNum = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
};
const dayStr = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);

/** İki `YYYY-MM-DD` arası gün (b - a). */
export const dayDiff = (a: string, b: string) => dayNum(b) - dayNum(a);

/**
 * Gecikme zammı (kuruş): gecikmiş ANAPARA × gün × o günkü aylık oran / 30.
 * Oran tablosu tarihe göre değişirse her gün kendi oranıyla işler. Vade günü ve
 * önceki günler zam doğurmaz; `payKey` ödeme (ya da bugün) tarihi.
 */
export function lateInterest(principal: number, dueKey: string, payKey: string, table: readonly LateRateRow[] = DEFAULT_LATE_RATES): number {
  if (principal <= 0) return 0;
  const start = dayNum(dueKey);
  const end = dayNum(payKey);
  if (end <= start) return 0;
  const rows = [...table].sort((a, b) => (a.from < b.from ? -1 : 1));
  let total = 0;
  for (let d = start + 1; d <= end; d++) {
    const key = dayStr(d);
    let rate = rows[0]?.monthlyPct ?? 0;
    for (const r of rows) if (r.from <= key) rate = r.monthlyPct;
    total += (principal * rate) / 100 / 30;
  }
  return Math.round(total);
}

/* --- Fatura hesabı ------------------------------------------------------- */

export type BillingInput = {
  kind: BillingKind;
  voltage: "AG" | "OG";
  usage: { t1: number; t2: number; t3: number; total: number };
  reactive?: { inductive: number; capacitive: number };
  demandKw?: number;
  contractKw?: number;
  /** Tedarikçi dilim fiyatları, TL/kWh (vergisiz). */
  prices: { t1: number; t2: number; t3: number };
};

export type BillingResult = {
  energy: number;
  /** Dağıtım + iletim (sistem kullanım) bedeli. */
  distribution: number;
  yekdem: number;
  funds: number;
  btv: number;
  reactive: number;
  power: number;
  vat: number;
  total: number;
  /** Bilgi: dağıtım kaleminin iletim payı ve aşan reaktif kVArh. */
  transmissionPart: number;
  reactiveExcessKvarh: number;
  powerOverKw: number;
};

const k = (tl: number) => Math.round(tl * 100);

/** Aşan reaktif (kVArh): endüktif ve kapasitif sınırın üstü. Muaf sınıfta 0. */
export function reactiveExcess(input: Pick<BillingInput, "kind" | "usage" | "reactive">, params: BillingParams = DEFAULT_PARAMS): number {
  if (!input.reactive || !params.reactiveKinds.includes(input.kind)) return 0;
  const active = Math.max(0, input.usage.total);
  const ind = Math.max(0, input.reactive.inductive - active * params.reactiveInductiveLimit);
  const cap = Math.max(0, input.reactive.capacitive - active * params.reactiveCapacitiveLimit);
  return Math.round(ind + cap);
}

/** Tek hesap: üreteç, tahakkuk ve teklif karşılaştırması bunu çağırır. */
export function computeInvoice(input: BillingInput, params: BillingParams = DEFAULT_PARAMS): BillingResult {
  const { usage, prices, kind } = input;
  const total = Math.max(0, usage.total);
  const energy = k(usage.t1 * prices.t1 + usage.t2 * prices.t2 + usage.t3 * prices.t3);
  const transmissionPart = k(total * params.transmission);
  const distribution = k(total * params.distribution[kind]) + transmissionPart;
  const yekdem = k(total * params.yekdem);
  const funds = Math.round((energy * params.fundPct[kind]) / 100);
  const btv = Math.round(((energy + distribution) * params.btvPct[kind]) / 100);
  const reactiveExcessKvarh = reactiveExcess(input, params);
  const reactive = k(reactiveExcessKvarh * params.reactiveRate);
  const powerOverKw = input.voltage === "OG" && input.contractKw && input.demandKw ? Math.max(0, Math.round((input.demandKw - input.contractKw) * 10) / 10) : 0;
  const power = k(powerOverKw * params.powerOverRate);
  const base = energy + distribution + yekdem + funds + btv + reactive + power;
  const vat = Math.round((base * params.vatPct[kind]) / 100);
  return { energy, distribution, yekdem, funds, btv, reactive, power, vat, total: base + vat, transmissionPart, reactiveExcessKvarh, powerOverKw };
}

/** Çok zamanlı tarife fiyatları: tek zamanlıda tek fiyat. */
export function zonePrices(base: number, multiZone: boolean, params: BillingParams = DEFAULT_PARAMS) {
  const m = params.zoneMultiplier;
  return multiZone
    ? { t1: Math.round(base * m.t1 * 1000) / 1000, t2: Math.round(base * m.t2 * 1000) / 1000, t3: Math.round(base * m.t3 * 1000) / 1000 }
    : { t1: base, t2: base, t3: base };
}

/* --- Durum (türetilmiş) -------------------------------------------------- */

export type DerivedStatus = "kesildi" | "odendi" | "kismi" | "gecikti" | "itirazli";

/**
 * Fatura durumu elle yazılmaz, türetilir: anapara tamamen ödendiyse Ödendi
 * (gecikme zammı ödemeyle birlikte tahsil edilir; bkz. `recordPayment`),
 * kısmi ödeme Kısmi, itiraz açıksa İtirazlı, vadesi geçmişse Gecikti.
 */
export function deriveStatus(inv: { total: number; paid: number; due: string; disputed?: boolean }, todayKey: string): DerivedStatus {
  /* Tutarı sıfır olan fatura (kapalı abonenin kapanış dönemi) borç doğurmaz: Ödendi sayılır. */
  if (inv.paid >= inv.total) return "odendi";
  if (inv.disputed) return "itirazli";
  if (inv.paid > 0) return "kismi";
  return inv.due < todayKey ? "gecikti" : "kesildi";
}

/** Ödenmesi gereken (zam dahil) kalan: anapara kalanı + ödenmemiş zam. */
export const owed = (inv: { total: number; paid: number; lateFee?: number; lateFeePaid?: number }) =>
  Math.max(0, inv.total - inv.paid) + Math.max(0, (inv.lateFee ?? 0) - (inv.lateFeePaid ?? 0));
