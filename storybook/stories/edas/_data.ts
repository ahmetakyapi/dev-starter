/**
 * Edaş Portalı: bütün sahte veri tek yerde.
 *
 * Kurgu: "Kuzeyova Elektrik Dağıtım A.Ş." (kurgusal; gerçek bir dağıtım ya da
 * perakende şirketi değildir) pilot bölgesindeki 360 abonenin sayaç, okuma,
 * fatura ve ödeme işlerini bu portaldan yürütür. Bugün 21 Kasım 2026, Cumartesi,
 * 10.40. Bölge, ilçe ve şirket adları uydurmadır.
 *
 * TUTARLILIK İLKESİ (Pusula ile aynı): hiçbir toplam elle yazılmaz. Müşteri,
 * sayaç, okuma, fatura, ödeme, arıza ve iş emri listeleri tohumlu bir
 * üreteçle (her derlemede aynı) BİR KEZ üretilir; panodaki her karo, grafik
 * ve rapor aynı listelerden süzülüp toplanır. `Date.now()` yok: "bugün"
 * sabit (`TODAY`).
 *
 * Para: kuruş kayması olmasın diye hesaplar kuruş (tam sayı) üzerinden
 * yapılır, `kurus` alanları tam sayı kuruştur; ekranda `tl()` ile TL'ye çevrilir.
 */

/* --- Takvim ve biçim ---------------------------------------------------- */

export const TODAY = new Date(2026, 10, 21, 10, 40);
export const TODAY_KEY = "2026-11-21";
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

export const tlFmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
export const tlWhole = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
export const tlCompact = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", notation: "compact", compactDisplay: "long", maximumFractionDigits: 1 });
/** Kuruştan TL metni: `tl(123456)` → "₺1.234,56". */
export const tl = (kurus: number) => tlFmt.format(kurus / 100);
export const tlShort = (kurus: number) => tlWhole.format(kurus / 100);
export const num = new Intl.NumberFormat("tr-TR");
export const num1 = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const kwh = (value: number) => `${num.format(Math.round(value))} kWh`;
export const mwh = (value: number) => `${num1.format(value / 1000)} MWh`;
export const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
export const fullDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
export const longDay = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long" });
export const clock = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });
export const monthName = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
export const monthShort = new Intl.DateTimeFormat("tr-TR", { month: "short" });
export const dateTime = (d: Date) => `${shortDate.format(d)}, ${clock.format(d)}`;
export const pct = (part: number, whole: number, digits = 1) => (whole ? Math.round((part / whole) * 100 * 10 ** digits) / 10 ** digits : 0);
export const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : null);
/** `YYYY-MM-DD` ya da `YYYY-MM` metninden yerel tarih. */
export const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
};
export const dayLabel = (key: string) => shortDate.format(parseDay(key));
export const periodLabel = (period: string) => monthName.format(parseDay(period));

function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const hashSeed = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};
const pick = <T,>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)];
function weighted<T>(rand: () => number, items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let at = rand() * total;
  for (const item of items) {
    at -= weight(item);
    if (at <= 0) return item;
  }
  return items[items.length - 1];
}
const between = (rand: () => number, lo: number, hi: number) => lo + rand() * (hi - lo);
const int = (rand: () => number, lo: number, hi: number) => Math.round(between(rand, lo, hi));

/* --- Şirket ve kullanıcı ------------------------------------------------ */

export const PRODUCT = { name: "Kuzeyova", legalName: "Kuzeyova Elektrik Dağıtım A.Ş.", portal: "Dağıtım Portalı" } as const;
export const ME = { id: "u-1", name: "Aylin Yıldırım", role: "Ölçüm ve Tahakkuk Müdürü", email: "aylin.yildirim@kuzeyova-dagitim.example" } as const;

/* --- Bölgeler, trafo merkezleri ------------------------------------------ */

export type Region = { id: string; name: string; districts: readonly string[]; lossTarget: number };
export const REGIONS: readonly Region[] = [
  { id: "merkez", name: "Merkez", districts: ["Çarşıbaşı", "Yeniköy", "Aksungur"], lossTarget: 7 },
  { id: "kiyi", name: "Kıyı", districts: ["Dalgakıran", "Tuzlaova", "Martıbaşı"], lossTarget: 8 },
  { id: "vadi", name: "Vadi", districts: ["Derebaşı", "Çınaraltı", "Kızılırmak Mah."], lossTarget: 9 },
  { id: "ova", name: "Ova", districts: ["Sulakova", "Buğdaylı", "Akçaağıl"], lossTarget: 10 },
  { id: "yayla", name: "Yayla", districts: ["Karlıdere", "Pelitli", "Sarıyayla"], lossTarget: 12 },
  { id: "sanayi", name: "Sanayi Havzası", districts: ["Organize Bölge 1", "Organize Bölge 2", "Demirkapı"], lossTarget: 5 },
];
export const region = (id: string) => REGIONS.find((r) => r.id === id) ?? REGIONS[0];

export type Substation = { id: string; name: string; regionId: string; capacityMva: number };
export const SUBSTATIONS: readonly Substation[] = REGIONS.flatMap((r, i) =>
  Array.from({ length: i === 5 ? 3 : 2 }, (_, k) => ({
    id: `TM-${i + 1}${k + 1}`,
    name: `${r.name} TM-${k + 1}`,
    regionId: r.id,
    capacityMva: [63, 50, 100, 40, 25, 80][i] + k * 10,
  })),
);
export const substation = (id: string) => SUBSTATIONS.find((s) => s.id === id) ?? SUBSTATIONS[0];

/* --- Tedarikçiler -------------------------------------------------------- */

export type SupplierKind = "gorevli" | "perakende";
export type Supplier = {
  id: string;
  name: string;
  kind: SupplierKind;
  license: string;
  /** Birim enerji bedeli, TL/kWh (vergisiz). */
  unitPrice: number;
  /** Sözleşme bitişi. */
  contractEnd: string;
  phone: string;
};
export const SUPPLIERS: readonly Supplier[] = [
  { id: "S-01", name: "Ova Görevli Tedarik A.Ş.", kind: "gorevli", license: "GTŞ-2013/04", unitPrice: 3.12, contractEnd: "2027-12-31", phone: "0850 000 01 01" },
  { id: "S-02", name: "Kıvılcım Enerji Perakende", kind: "perakende", license: "TPL-2015/118", unitPrice: 2.94, contractEnd: "2027-03-31", phone: "0850 000 02 02" },
  { id: "S-03", name: "Pınar Elektrik Satış", kind: "perakende", license: "TPL-2016/207", unitPrice: 2.88, contractEnd: "2026-12-31", phone: "0850 000 03 03" },
  { id: "S-04", name: "Anadolu Işık Enerji", kind: "perakende", license: "TPL-2014/061", unitPrice: 3.01, contractEnd: "2027-06-30", phone: "0850 000 04 04" },
  { id: "S-05", name: "Gün Doğumu Enerji Ticaret", kind: "perakende", license: "TPL-2019/342", unitPrice: 2.79, contractEnd: "2027-01-31", phone: "0850 000 05 05" },
  { id: "S-06", name: "Çağ Enerji Satış", kind: "perakende", license: "TPL-2018/289", unitPrice: 2.97, contractEnd: "2026-11-30", phone: "0850 000 06 06" },
];
export const supplier = (id: string) => SUPPLIERS.find((s) => s.id === id) ?? SUPPLIERS[0];

/* --- Müşteriler ----------------------------------------------------------- */

export type CustomerKind = "bireysel" | "ticari" | "sanayi" | "tarim";
export const KIND_LABEL: Record<CustomerKind, string> = { bireysel: "Konut", ticari: "Ticarethane", sanayi: "Sanayi", tarim: "Tarımsal Sulama" };
export const KINDS: readonly CustomerKind[] = ["bireysel", "ticari", "sanayi", "tarim"];
export type CustomerStatus = "aktif" | "kesik" | "askida" | "kapali";
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = { aktif: "Aktif", kesik: "Enerjisi Kesik", askida: "Askıda", kapali: "Kapalı" };

export type Customer = {
  id: string;
  name: string;
  kind: CustomerKind;
  voltage: "AG" | "OG";
  /** Serbest tüketici: tedarikçisini seçebilir. */
  free: boolean;
  supplierId: string;
  regionId: string;
  district: string;
  address: string;
  /** Tesisat numarası (sayaca bağlı). */
  installation: string;
  /** Kimlik/vergi no son haneleri (KVKK: maskeli). */
  taxMasked: string;
  phone: string;
  email: string;
  status: CustomerStatus;
  since: string;
  /** Ortalama aylık tüketim (üretim temeli). */
  baseKwh: number;
  tariff: "tek-zamanli" | "cok-zamanli";
  /** Otomatik ödeme talimatı var mı. */
  autoPay: boolean;
};

const FIRST = ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Mustafa", "Emine", "Ali", "Hatice", "Hasan", "Zeynep", "İbrahim", "Elif", "Hüseyin", "Merve", "Yusuf", "Selin", "Ömer", "Büşra", "Murat", "Esra", "Kemal", "Derya", "Burak", "Özlem"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Korkmaz", "Güneş", "Tekin", "Aksoy", "Erdem"];
const SHOP = ["Bakkal", "Eczane", "Kırtasiye", "Kuaför", "Market", "Fırın", "Kafe", "Berber", "Ayakkabıcı", "Çiçekçi", "Lokanta", "Oto Yedek Parça", "Tekel Bayii", "Mobilya", "Hırdavat"];
const FACTORY = ["Plastik", "Tekstil", "Metal Döküm", "Ambalaj", "Gıda", "Makine", "Kimya", "Mermer", "Boya", "Cam"];
const FARM = ["Sulama Kooperatifi", "Çiftliği", "Seracılık", "Tarımsal Kalkınma Koop.", "Sebze Üreticileri Birliği"];
const STREET = ["Atatürk Cd.", "Cumhuriyet Mah.", "İnönü Sk.", "Gazi Cd.", "Barış Sk.", "Fatih Mah.", "Yeşilyurt Sk.", "Çınar Sk.", "Bahçelievler Cd.", "Hürriyet Mah."];

export const CUSTOMER_COUNT = 360;

function buildCustomers(): Customer[] {
  const rand = seeded(20261121);
  return Array.from({ length: CUSTOMER_COUNT }, (_, i): Customer => {
    const kind = weighted(rand, KINDS, (k) => ({ bireysel: 56, ticari: 24, sanayi: 9, tarim: 11 })[k]);
    const regionPool = kind === "sanayi" ? REGIONS.filter((r) => r.id === "sanayi") : kind === "tarim" ? REGIONS.filter((r) => ["ova", "vadi", "yayla"].includes(r.id)) : REGIONS.filter((r) => r.id !== "sanayi");
    const reg = pick(rand, regionPool);
    const district = pick(rand, reg.districts);
    const voltage: "AG" | "OG" = kind === "sanayi" || (kind === "ticari" && rand() < 0.14) ? "OG" : "AG";
    const free = voltage === "OG" || (kind === "ticari" && rand() < 0.2);
    const sup = free && rand() < 0.8 ? pick(rand, SUPPLIERS.filter((s) => s.kind === "perakende")) : SUPPLIERS[0];
    const person = `${pick(rand, FIRST)} ${pick(rand, LAST)}`;
    const name =
      kind === "bireysel"
        ? person
        : kind === "ticari"
          ? `${pick(rand, LAST)} ${pick(rand, SHOP)}`
          : kind === "sanayi"
            ? `${pick(rand, LAST)} ${pick(rand, FACTORY)} San. Tic. A.Ş.`
            : `${district} ${pick(rand, FARM)}`;
    const baseKwh = Math.round(
      kind === "bireysel" ? between(rand, 140, 420) : kind === "ticari" ? between(rand, 700, 4200) : kind === "sanayi" ? between(rand, 4_000, 22_000) : between(rand, 600, 6500),
    );
    const status: CustomerStatus = weighted(rand, ["aktif", "kesik", "askida", "kapali"] as const, (s) => ({ aktif: 91, kesik: 4, askida: 2, kapali: 3 })[s]);
    const since = `${int(rand, 2009, 2025)}-${pad(int(rand, 1, 12))}-${pad(int(rand, 1, 28))}`;
    const idNum = 10001 + i * 7;
    const taxLen = kind === "bireysel" ? 11 : 10;
    return {
      id: `C-${idNum}`,
      name,
      kind,
      voltage,
      free,
      supplierId: sup.id,
      regionId: reg.id,
      district,
      address: `${pick(rand, STREET)} No: ${int(rand, 1, 140)}, ${district}`,
      installation: `${reg.id === "sanayi" ? "4" : "1"}${String(int(rand, 1_000_000, 9_999_999))}`,
      taxMasked: `${"•".repeat(taxLen - 3)}${String(int(rand, 100, 999))}`,
      phone: `05${int(rand, 30, 59)} ••• ${String(int(rand, 10, 99))} ${String(int(rand, 10, 99))}`,
      email: `${name.split(" ")[0].toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c]!)}•••@example.com`,
      status,
      since,
      baseKwh,
      tariff: kind === "bireysel" && rand() < 0.7 ? "tek-zamanli" : "cok-zamanli",
      autoPay: kind === "bireysel" ? rand() < 0.28 : rand() < 0.4,
    };
  });
}
export const CUSTOMERS: readonly Customer[] = buildCustomers();
export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id);
export const customer = (id: string) => customerById(id) ?? CUSTOMERS[0];

/* --- Sayaçlar -------------------------------------------------------------- */

export type MeterComm = "ami" | "gsm" | "elle";
export const COMM_LABEL: Record<MeterComm, string> = { ami: "AMI (PLC/RF)", gsm: "GSM / GPRS", elle: "Elle Okuma" };
export type MeterStatus = "okunuyor" | "iletisim-yok" | "arizali" | "mudahale";
export const METER_STATUS_LABEL: Record<MeterStatus, string> = { okunuyor: "Okunuyor", "iletisim-yok": "İletişim Yok", arizali: "Arızalı", mudahale: "Müdahale Şüphesi" };

export type Meter = {
  id: string;
  serial: string;
  model: string;
  customerId: string;
  substationId: string;
  comm: MeterComm;
  status: MeterStatus;
  /** Çarpan: akım ve gerilim trafosu oranları çarpımı (OG'de > 1). */
  multiplier: number;
  ct: string;
  vt: string;
  multiZone: boolean;
  installed: string;
  lastSeen: Date;
  /** Okuma günü (ayın kaçı). */
  readDay: number;
  firmware: string;
  /** Başlangıç endeksi (kWh, T1/T2/T3). */
  base: { t1: number; t2: number; t3: number };
};
const METER_MODELS = ["Akıllı Sayaç AS-310", "Akıllı Sayaç AS-330 (3 faz)", "Elektronik Sayaç ES-120", "OG Sayaç OS-500"];

function buildMeters(): Meter[] {
  const rand = seeded(77421);
  return CUSTOMERS.map((c, i): Meter => {
    const og = c.voltage === "OG";
    const status = weighted(rand, ["okunuyor", "iletisim-yok", "arizali", "mudahale"] as const, (s) => ({ okunuyor: 92, "iletisim-yok": 4.5, arizali: 1.8, mudahale: 1.7 })[s]);
    const comm: MeterComm = og ? "gsm" : c.kind === "tarim" ? weighted(rand, ["gsm", "elle"] as const, (k) => (k === "gsm" ? 60 : 40)) : weighted(rand, ["ami", "gsm", "elle"] as const, (k) => ({ ami: 68, gsm: 20, elle: 12 })[k]);
    const last = status === "okunuyor" ? addDays(TODAY, 0) : addDays(TODAY, -int(rand, status === "iletisim-yok" ? 2 : 1, status === "iletisim-yok" ? 19 : 9));
    const sub = pick(rand, SUBSTATIONS.filter((s) => s.regionId === c.regionId));
    const multi = c.tariff === "cok-zamanli";
    const startKwh = int(rand, 4000, 60000) + c.baseKwh * 18;
    return {
      id: `M-${String(i + 1).padStart(4, "0")}`,
      serial: `KZ${og ? "O" : "A"}-${int(rand, 21, 25)}-${String(int(rand, 100000, 999999))}`,
      model: og ? METER_MODELS[3] : pick(rand, METER_MODELS.slice(0, 3)),
      customerId: c.id,
      substationId: sub.id,
      comm,
      status,
      multiplier: og ? pick(rand, [40, 60, 80, 120, 200]) : 1,
      ct: og ? pick(rand, ["200/5", "300/5", "400/5", "600/5"]) : "—",
      vt: og ? pick(rand, ["15.8 kV/100 V", "33 kV/100 V"]) : "—",
      multiZone: multi,
      installed: `${int(rand, 2017, 2026)}-${pad(int(rand, 1, 12))}-${pad(int(rand, 1, 28))}`,
      lastSeen: last,
      readDay: int(rand, 1, 27),
      firmware: pick(rand, ["v2.4.1", "v2.4.3", "v2.5.0", "v3.0.2"]),
      base: multi ? { t1: Math.round(startKwh * 0.46), t2: Math.round(startKwh * 0.3), t3: Math.round(startKwh * 0.24) } : { t1: startKwh, t2: 0, t3: 0 },
    };
  });
}
export const METERS: readonly Meter[] = buildMeters();
export const meterById = (id: string) => METERS.find((m) => m.id === id);
export const metersOf = (customerId: string) => METERS.filter((m) => m.customerId === customerId);
export const meterOf = (customerId: string) => METERS.find((m) => m.customerId === customerId) ?? METERS[0];

/* --- Okumalar ---------------------------------------------------------------- */

export type ReadingSource = "uzaktan" | "saha" | "tahmini" | "beyan";
export const SOURCE_LABEL: Record<ReadingSource, string> = { uzaktan: "Uzaktan Okuma", saha: "Saha Okuma", tahmini: "Tahmini", beyan: "Abone Beyanı" };
export type ReadingFlag = "geri-sayim" | "ani-sicrama" | "dusuk-tuketim" | "kapak-acma" | "manyetik" | "faz-kaybi";
export const FLAG_LABEL: Record<ReadingFlag, string> = {
  "geri-sayim": "Endeks Geri Sayımı",
  "ani-sicrama": "Ani Tüketim Sıçraması",
  "dusuk-tuketim": "Beklenenin Çok Altında",
  "kapak-acma": "Kapak Açma Kaydı",
  manyetik: "Manyetik Müdahale",
  "faz-kaybi": "Faz Kaybı",
};
export type ReadingStatus = "dogrulandi" | "supheli" | "bekliyor" | "duzeltildi";
export const READING_STATUS_LABEL: Record<ReadingStatus, string> = { dogrulandi: "Doğrulandı", supheli: "Şüpheli", bekliyor: "Okuma Bekliyor", duzeltildi: "Düzeltildi" };

export type Reading = {
  id: string;
  meterId: string;
  customerId: string;
  /** `YYYY-MM`. */
  period: string;
  /** `YYYY-MM-DD`; bekleyen okumada planlanan gün. */
  date: string;
  source: ReadingSource;
  status: ReadingStatus;
  /** Dönem sonu kümülatif endeks (kWh, çarpan DAHİL değil). */
  index: { t1: number; t2: number; t3: number };
  /** Dönem tüketimi (kWh, çarpan DAHİL). */
  usage: { t1: number; t2: number; t3: number; total: number };
  /** Endüktif / kapasitif reaktif (kVArh). */
  reactive: { inductive: number; capacitive: number };
  /** En yüksek talep (kW). */
  demandKw: number;
  flags: readonly ReadingFlag[];
};

/** Son on iki dönem, eskiden yeniye. */
export const PERIODS_12: readonly string[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, 10 - (11 - i), 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
});
export const CURRENT_PERIOD = PERIODS_12[11];

/** Aylık mevsimsellik: kış yüksek (konut), yaz sulama yüksek (tarım). */
const SEASON: Record<CustomerKind, readonly number[]> = {
  bireysel: [1.28, 1.22, 1.05, 0.92, 0.86, 0.9, 1.0, 1.02, 0.9, 0.95, 1.1, 1.25],
  ticari: [1.05, 1.03, 1.0, 0.98, 1.0, 1.06, 1.12, 1.12, 1.02, 0.98, 1.0, 1.04],
  sanayi: [0.96, 0.98, 1.02, 1.03, 1.02, 1.0, 0.97, 0.9, 1.03, 1.05, 1.04, 1.0],
  tarim: [0.1, 0.12, 0.2, 0.5, 1.0, 1.7, 2.2, 2.0, 1.3, 0.5, 0.2, 0.1],
};

function buildReadings(): Reading[] {
  const out: Reading[] = [];
  for (const m of METERS) {
    const c = customer(m.customerId);
    const rand = seeded(hashSeed(m.id));
    let idx = { ...m.base };
    PERIODS_12.forEach((period, pi) => {
      const monthIdx = Number(period.slice(5)) - 1;
      const plannedDay = Math.min(m.readDay, 27);
      const date = `${period}-${pad(plannedDay)}`;
      const future = date > TODAY_KEY;
      const baseUse = c.baseKwh * SEASON[c.kind][monthIdx] * between(rand, 0.9, 1.1);
      const usable = c.status === "kapali" && pi > 8 ? 0 : baseUse;
      const total = Math.round(usable);
      const share = m.multiZone ? [0.46 + between(rand, -0.03, 0.03), 0.3 + between(rand, -0.02, 0.02)] : [1, 0];
      const u1 = Math.round(total * share[0]);
      const u2 = Math.round(total * share[1]);
      const u3 = Math.max(0, total - u1 - u2);
      const flags: ReadingFlag[] = [];
      let status: ReadingStatus = "dogrulandi";
      let source: ReadingSource = m.comm === "elle" ? "saha" : "uzaktan";
      if (future) {
        status = "bekliyor";
        source = "tahmini";
      } else {
        const r = rand();
        if (r < 0.018) flags.push("geri-sayim");
        else if (r < 0.04) flags.push("ani-sicrama");
        else if (r < 0.06) flags.push("dusuk-tuketim");
        else if (r < 0.068) flags.push("kapak-acma");
        else if (r < 0.074) flags.push("manyetik");
        else if (r < 0.08 && c.voltage === "OG") flags.push("faz-kaybi");
        if (m.status === "mudahale" && pi >= 10 && !flags.includes("manyetik")) flags.push("kapak-acma");
        if (flags.length) status = pi <= 8 && rand() < 0.7 ? "duzeltildi" : "supheli";
        if (m.comm !== "elle" && rand() < 0.02) source = "saha";
        if (m.status === "iletisim-yok" && pi === 11) {
          source = "tahmini";
          status = "supheli";
        }
      }
      const factor = flags.includes("ani-sicrama") ? 3.4 : flags.includes("dusuk-tuketim") ? 0.12 : 1;
      const used1 = Math.round(u1 * factor);
      const used2 = Math.round(u2 * factor);
      const used3 = Math.round(u3 * factor);
      const usedTotal = used1 + used2 + used3;
      const sign = flags.includes("geri-sayim") ? -1 : 1;
      const div = m.multiplier || 1;
      if (!future) idx = { t1: idx.t1 + Math.round((sign * used1) / div), t2: idx.t2 + Math.round((sign * used2) / div), t3: idx.t3 + Math.round((sign * used3) / div) };
      const react = Math.round(usedTotal * between(rand, 0.18, c.voltage === "OG" ? 0.42 : 0.3));
      out.push({
        id: `R-${m.id.slice(2)}-${period.replace("-", "")}`,
        meterId: m.id,
        customerId: c.id,
        period,
        date,
        source,
        status,
        index: { ...idx },
        usage: { t1: used1, t2: used2, t3: used3, total: usedTotal },
        reactive: { inductive: react, capacitive: Math.round(react * between(rand, 0.02, 0.12)) },
        demandKw: Math.round((usedTotal / 720) * between(rand, 2.2, 4.6) * 10) / 10,
        flags,
      });
    });
  }
  return out;
}
export const READINGS: readonly Reading[] = buildReadings();
export const readingsOf = (meterId: string) => READINGS.filter((r) => r.meterId === meterId);
export const readingsForCustomer = (customerId: string) => READINGS.filter((r) => r.customerId === customerId);
export const readingsIn = (period: string) => READINGS.filter((r) => r.period === period);
export const PENDING_READINGS = READINGS.filter((r) => r.period === CURRENT_PERIOD && r.status === "bekliyor");
export const FLAGGED_READINGS = READINGS.filter((r) => r.status === "supheli");

/* --- Ham veri: 15 dakikalık yük profili ------------------------------------- */

export type LoadPoint = { time: string; slot: number; kwh: number; kw: number; volt: number; amp: number; pf: number; missing: boolean };

/** Sayacın bir gününün 96 aralıklı yük profili; eksik paketler `missing`. */
export function loadProfile(meterId: string, day: string): LoadPoint[] {
  const m = meterById(meterId) ?? METERS[0];
  const c = customer(m.customerId);
  const rand = seeded(hashSeed(`${meterId}:${day}`));
  const monthIdx = Number(day.slice(5, 7)) - 1;
  const daily = (c.baseKwh * SEASON[c.kind][monthIdx]) / 30;
  const weekend = [0, 6].includes(parseDay(day).getDay());
  const lostWindow = m.status === "iletisim-yok" ? [int(rand, 20, 60), int(rand, 6, 20)] : rand() < 0.25 ? [int(rand, 4, 80), int(rand, 1, 6)] : null;
  return Array.from({ length: 96 }, (_, slot) => {
    const hour = slot / 4;
    const home = 0.55 + 0.9 * Math.exp(-((hour - 8) ** 2) / 6) + 1.5 * Math.exp(-((hour - 20) ** 2) / 7);
    const shop = 0.35 + 1.4 * Math.exp(-((hour - 14) ** 2) / 24);
    const plant = hour >= 7 && hour < 19 && !weekend ? 1.55 : 0.55;
    const farm = hour >= 5 && hour < 11 ? 2.2 : 0.2;
    const shape = c.kind === "bireysel" ? home : c.kind === "ticari" ? shop : c.kind === "sanayi" ? plant : farm;
    const kwhValue = Math.max(0, (daily / 24 / 4) * shape * between(rand, 0.86, 1.14)) * (weekend && c.kind === "ticari" ? 0.8 : 1);
    const missing = lostWindow ? slot >= lostWindow[0] && slot < lostWindow[0] + lostWindow[1] : false;
    const kw = kwhValue * 4;
    const volt = (c.voltage === "OG" ? 15800 : 230) * between(rand, 0.985, 1.015);
    const pf = Math.round(between(rand, 0.86, 0.99) * 100) / 100;
    const amp = c.voltage === "OG" ? (kw * 1000) / (Math.sqrt(3) * volt * pf) : (kw * 1000) / (volt * pf);
    return {
      slot,
      time: `${pad(Math.floor(slot / 4))}:${pad((slot % 4) * 15)}`,
      kwh: Math.round(kwhValue * 1000) / 1000,
      kw: Math.round(kw * 100) / 100,
      volt: Math.round(volt * 10) / 10,
      amp: Math.round(amp * 100) / 100,
      pf,
      missing,
    };
  });
}

/* --- Faturalar ---------------------------------------------------------------- */

export type InvoiceStatus = "kesildi" | "odendi" | "kismi" | "gecikti" | "itirazli";
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = { kesildi: "Kesildi", odendi: "Ödendi", kismi: "Kısmi Ödendi", gecikti: "Gecikti", itirazli: "İtirazlı" };

export type Invoice = {
  id: string;
  customerId: string;
  supplierId: string;
  period: string;
  issued: string;
  due: string;
  usageKwh: number;
  /** Kuruş cinsinden kalemler. */
  energy: number;
  distribution: number;
  yekdem: number;
  funds: number;
  btv: number;
  vat: number;
  total: number;
  paid: number;
  status: InvoiceStatus;
  dispute?: string;
};

/** Dağıtım bedeli, TL/kWh. */
const DIST_RATE: Record<CustomerKind, number> = { bireysel: 0.79, ticari: 0.66, sanayi: 0.31, tarim: 0.4 };
const YEKDEM_RATE = 0.06;

const DISPUTES = ["Tüketim beklenenden yüksek", "Sayaç endeksi hatalı", "Tarife yanlış uygulanmış", "Çift fatura", "Taşınma sonrası adres hatası"];

function buildInvoices(): Invoice[] {
  const out: Invoice[] = [];
  for (const r of READINGS) {
    if (r.status === "bekliyor") continue;
    const c = customer(r.customerId);
    const sup = supplier(c.supplierId);
    const rand = seeded(hashSeed(`inv:${r.id}`));
    const kwhUse = Math.max(0, r.usage.total);
    const energy = Math.round(kwhUse * sup.unitPrice * 100);
    const distribution = Math.round(kwhUse * DIST_RATE[c.kind] * 100);
    const yekdem = Math.round(kwhUse * YEKDEM_RATE * 100);
    const funds = Math.round(energy * (c.kind === "bireysel" ? 0.03 : 0.01));
    const btv = c.kind === "tarim" ? 0 : Math.round((energy + distribution) * (c.kind === "sanayi" ? 0.01 : 0.05));
    const vatRate = c.kind === "tarim" ? 0.1 : 0.2;
    const vat = Math.round((energy + distribution + yekdem + funds + btv) * vatRate);
    const total = energy + distribution + yekdem + funds + btv + vat;
    const issued = dayKey(addDays(parseDay(r.date), 3));
    const due = dayKey(addDays(parseDay(issued), 14));
    const age = PERIODS_12.indexOf(CURRENT_PERIOD) - PERIODS_12.indexOf(r.period);
    const paidProb = age >= 2 ? 0.988 : age === 1 ? 0.95 : 0.2;
    const roll = rand();
    let status: InvoiceStatus;
    let paid = 0;
    if (c.status === "kapali" && age >= 2) {
      status = "odendi";
      paid = total;
    } else if (roll < paidProb) {
      if (rand() < 0.04) {
        status = "kismi";
        paid = Math.round(total * between(rand, 0.3, 0.8));
      } else {
        status = "odendi";
        paid = total;
      }
    } else if (rand() < 0.07) {
      status = "itirazli";
    } else {
      status = due < TODAY_KEY ? "gecikti" : "kesildi";
    }
    if (issued > TODAY_KEY) continue;
    if ((status === "kismi" || status === "odendi") && due < TODAY_KEY && status === "kismi") status = "kismi";
    out.push({
      id: `F-${r.period.replace("-", "")}-${r.id.slice(2, 6)}${r.id.slice(6, 8)}`,
      customerId: c.id,
      supplierId: sup.id,
      period: r.period,
      issued,
      due,
      usageKwh: kwhUse,
      energy,
      distribution,
      yekdem,
      funds,
      btv,
      vat,
      total,
      paid,
      status,
      dispute: status === "itirazli" ? pick(rand, DISPUTES) : undefined,
    });
  }
  return out;
}
export const INVOICES: readonly Invoice[] = buildInvoices();
export const invoicesOf = (customerId: string) => INVOICES.filter((i) => i.customerId === customerId);
export const invoiceById = (id: string) => INVOICES.find((i) => i.id === id);
export const invoicesIn = (period: string) => INVOICES.filter((i) => i.period === period);
export const balanceOf = (inv: Invoice) => inv.total - inv.paid;
export const OPEN_INVOICES = INVOICES.filter((i) => i.status !== "odendi");
export const OVERDUE_INVOICES = INVOICES.filter((i) => i.status === "gecikti" || (i.status === "kismi" && i.due < TODAY_KEY));

/* --- Ödemeler ------------------------------------------------------------------ */

export type PaymentChannel = "banka" | "ptt" | "online" | "otomatik";
export const CHANNEL_LABEL: Record<PaymentChannel, string> = { banka: "Banka / Şube", ptt: "PTT", online: "Online / Kart", otomatik: "Otomatik Ödeme" };
export const CHANNELS: readonly PaymentChannel[] = ["banka", "ptt", "online", "otomatik"];
export type Reconciliation = "mutabik" | "bekliyor" | "farkli";
export const RECON_LABEL: Record<Reconciliation, string> = { mutabik: "Mutabık", bekliyor: "Mutabakat Bekliyor", farkli: "Tutar Farkı" };

export type Payment = {
  id: string;
  invoiceId: string;
  customerId: string;
  date: string;
  channel: PaymentChannel;
  /** Kuruş. */
  amount: number;
  /** Gecikme zammı (kuruş); vadeden sonra ödenmişse. */
  lateFee: number;
  recon: Reconciliation;
  reference: string;
};

/** Gecikme zammı: aylık %2,5, gün hesabıyla. */
export const LATE_RATE_MONTHLY = 0.025;

function buildPayments(): Payment[] {
  const out: Payment[] = [];
  for (const inv of INVOICES) {
    if (!inv.paid) continue;
    const rand = seeded(hashSeed(`pay:${inv.id}`));
    const c = customer(inv.customerId);
    const lateDays = rand() < 0.1 ? int(rand, 1, 25) : 0;
    const offset = lateDays ? 14 + lateDays : int(rand, 1, 14);
    let date = dayKey(addDays(parseDay(inv.issued), offset));
    if (date > TODAY_KEY) date = TODAY_KEY;
    const channel: PaymentChannel = c.autoPay ? "otomatik" : weighted(rand, ["banka", "ptt", "online"] as const, (k) => ({ banka: 40, ptt: 14, online: 46 })[k]);
    const late = daysBetween(parseDay(inv.due), parseDay(date));
    const lateFee = late > 0 ? Math.round(inv.paid * LATE_RATE_MONTHLY * (late / 30)) : 0;
    const roll = rand();
    out.push({
      id: `P-${inv.id.slice(2)}`,
      invoiceId: inv.id,
      customerId: inv.customerId,
      date,
      channel,
      amount: inv.paid,
      lateFee,
      recon: date >= "2026-11-17" ? "bekliyor" : roll < 0.03 ? "farkli" : roll < 0.06 ? "bekliyor" : "mutabik",
      reference: `${channel === "banka" ? "BNK" : channel === "ptt" ? "PTT" : channel === "online" ? "WEB" : "OTO"}${String(int(rand, 10_000_000, 99_999_999))}`,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
export const PAYMENTS: readonly Payment[] = buildPayments();
export const paymentsOf = (customerId: string) => PAYMENTS.filter((p) => p.customerId === customerId);

export type PaymentPlan = { id: string; customerId: string; total: number; installments: number; paid: number; next: string; status: "devam" | "tamamlandi" | "bozuldu" };
function buildPlans(): PaymentPlan[] {
  const rand = seeded(551);
  const debtors = [...new Set(OVERDUE_INVOICES.map((i) => i.customerId))].filter((id) => customer(id).kind !== "sanayi");
  return debtors.slice(0, 10).map((id, i) => {
    const debt = OVERDUE_INVOICES.filter((x) => x.customerId === id).reduce((s, x) => s + balanceOf(x), 0);
    const installments = pick(rand, [3, 6, 9, 12]);
    const done = int(rand, 0, installments - 1);
    return {
      id: `PL-${2026}${pad(i + 1)}`,
      customerId: id,
      total: debt,
      installments,
      paid: done,
      next: dayKey(addDays(TODAY, int(rand, 2, 24))),
      status: rand() < 0.15 ? "bozuldu" : "devam",
    };
  });
}
export const PAYMENT_PLANS: readonly PaymentPlan[] = buildPlans();

/* --- Arıza, kesinti ve iş emirleri --------------------------------------------- */

export type OutageKind = "plansiz" | "planli";
export type OutageStatus = "acik" | "cozuldu" | "planlandi";
export type Outage = {
  id: string;
  kind: OutageKind;
  status: OutageStatus;
  substationId: string;
  regionId: string;
  start: Date;
  end: Date | null;
  affected: number;
  cause: string;
  crew: string;
};
const CAUSES_U = ["Kablo arızası", "Trafo aşırı yüklenme", "Fırtına, hat kopması", "Kuş teması", "Ağaç dalı teması", "Hatalı üçüncü kişi müdahalesi", "Izgara parçası arızası"];
const CAUSES_P = ["Hat bakımı", "Trafo değişimi", "Yeni şebeke bağlantısı", "Direk değişimi"];
const CREWS = ["Ekip A (Merkez)", "Ekip B (Kıyı)", "Ekip C (Vadi)", "Ekip D (Ova)", "Ekip E (Yayla)", "Ekip F (Sanayi)"];

function buildOutages(): Outage[] {
  const rand = seeded(99213);
  const rows: Outage[] = [];
  for (let i = 0; i < 34; i++) {
    const planned = rand() < 0.3;
    const sub = pick(rand, SUBSTATIONS);
    const daysAgo = i < 5 ? 0 : int(rand, 1, 58);
    const start = new Date(2026, 10, 21 - daysAgo, int(rand, 0, daysAgo === 0 ? 9 : 23), int(rand, 0, 59));
    const dur = planned ? int(rand, 120, 360) : Math.round(between(rand, 18, 260));
    const end = new Date(start.getTime() + dur * 60_000);
    const open = !planned && end > TODAY;
    const ratio = planned ? 0.2 : 0.12;
    const inRegion = CUSTOMERS.filter((c) => c.regionId === sub.regionId).length;
    rows.push({
      id: `K-${2026}${String(1100 + i)}`,
      kind: planned ? "planli" : "plansiz",
      status: planned && start > TODAY ? "planlandi" : open ? "acik" : "cozuldu",
      substationId: sub.id,
      regionId: sub.regionId,
      start,
      end: open ? null : end,
      affected: Math.max(3, Math.round(inRegion * ratio * between(rand, 0.4, 1.3))),
      cause: planned ? pick(rand, CAUSES_P) : pick(rand, CAUSES_U),
      crew: CREWS[REGIONS.findIndex((r) => r.id === sub.regionId)],
    });
  }
  // Planlı çalışma: yarın ve gelecek hafta (takvim için).
  for (let k = 0; k < 3; k++) {
    const sub = SUBSTATIONS[(k * 3 + 1) % SUBSTATIONS.length];
    const start = new Date(2026, 10, 22 + k * 2, 9, 0);
    rows.push({
      id: `K-${2026}${String(1200 + k)}`,
      kind: "planli",
      status: "planlandi",
      substationId: sub.id,
      regionId: sub.regionId,
      start,
      end: new Date(start.getTime() + 4 * 3_600_000),
      affected: 24 + k * 11,
      cause: CAUSES_P[k % CAUSES_P.length],
      crew: CREWS[REGIONS.findIndex((r) => r.id === sub.regionId)],
    });
  }
  return rows.sort((a, b) => b.start.getTime() - a.start.getTime());
}
export const OUTAGES: readonly Outage[] = buildOutages();
export const OPEN_OUTAGES = OUTAGES.filter((o) => o.status === "acik");
export const outageMinutes = (o: Outage) => (o.end ? Math.round((o.end.getTime() - o.start.getTime()) / 60_000) : Math.round((TODAY.getTime() - o.start.getTime()) / 60_000));

export type WorkOrderType = "kesme" | "baglama" | "sayac-degisim" | "okuma-turu" | "kontrol";
export const WORK_TYPE_LABEL: Record<WorkOrderType, string> = { kesme: "Enerji Kesme", baglama: "Yeniden Bağlama", "sayac-degisim": "Sayaç Değişimi", "okuma-turu": "Saha Okuma Turu", kontrol: "Kaçak Kontrolü" };
export type WorkOrder = { id: string; type: WorkOrderType; customerId: string | null; regionId: string; scheduled: Date; status: "planlandi" | "tamamlandi" | "iptal"; reason: string };

function buildWorkOrders(): WorkOrder[] {
  const rand = seeded(8123);
  const rows: WorkOrder[] = [];
  const debtors = [...new Set(OVERDUE_INVOICES.filter((i) => daysBetween(parseDay(i.due), TODAY) > 14).map((i) => i.customerId))];
  debtors.slice(0, 12).forEach((id, i) => {
    const c = customer(id);
    rows.push({
      id: `IE-${3000 + i}`,
      type: "kesme",
      customerId: id,
      regionId: c.regionId,
      scheduled: new Date(2026, 10, 21 + int(rand, 0, 6), 9 + int(rand, 0, 6), 0),
      status: "planlandi",
      reason: "Vadesi 15 günü aşan fatura borcu",
    });
  });
  const reconnect = CUSTOMERS.filter((c) => c.status === "kesik").slice(0, 6);
  reconnect.forEach((c, i) =>
    rows.push({ id: `IE-${3100 + i}`, type: "baglama", customerId: c.id, regionId: c.regionId, scheduled: new Date(2026, 10, 21, 11 + i, 0), status: i < 2 ? "tamamlandi" : "planlandi", reason: "Borç ödendi, yeniden bağlama talebi" }),
  );
  const faulty = METERS.filter((m) => m.status === "arizali");
  faulty.slice(0, 5).forEach((m, i) => {
    const c = customer(m.customerId);
    rows.push({ id: `IE-${3200 + i}`, type: "sayac-degisim", customerId: c.id, regionId: c.regionId, scheduled: new Date(2026, 10, 23 + i, 10, 0), status: "planlandi", reason: "Sayaç arızalı: değişim" });
  });
  METERS.filter((m) => m.status === "mudahale").slice(0, 4).forEach((m, i) => {
    const c = customer(m.customerId);
    rows.push({ id: `IE-${3300 + i}`, type: "kontrol", customerId: c.id, regionId: c.regionId, scheduled: new Date(2026, 10, 24 + i, 14, 0), status: "planlandi", reason: "Müdahale şüphesi: kaçak kontrolü" });
  });
  REGIONS.forEach((r, i) => rows.push({ id: `IE-${3400 + i}`, type: "okuma-turu", customerId: null, regionId: r.id, scheduled: new Date(2026, 10, 22 + (i % 4), 8, 30), status: "planlandi", reason: `${r.name} bölgesi aylık okuma turu` }));
  return rows.sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime());
}
export const WORK_ORDERS: readonly WorkOrder[] = buildWorkOrders();
export const UPCOMING_WORK = WORK_ORDERS.filter((w) => w.status === "planlandi" && w.scheduled >= startOfDay(TODAY));

/* --- Bölge ve bildirim özetleri (pano, raporlar) ------------------------------------ */

/**
 * Kayıp/kaçak: bölge girişine verilen enerji ile faturalanan enerji farkı.
 * Giriş enerjisi faturalanan tüketim ile bölgenin hedef kaybından HESAPLANIR
 * (hedefe yakın, ± sapma); elle yazılmaz.
 */
export function regionLoss(period: string) {
  return REGIONS.map((r) => {
    const rand = seeded(hashSeed(`loss:${r.id}:${period}`));
    const billed = READINGS.filter((x) => x.period === period && x.status !== "bekliyor" && customer(x.customerId).regionId === r.id).reduce((s, x) => s + x.usage.total, 0);
    const lossPct = Math.round((r.lossTarget + between(rand, -1.6, 2.4)) * 10) / 10;
    const input = Math.round(billed / (1 - lossPct / 100));
    return { region: r, billed, input, lossKwh: input - billed, lossPct };
  });
}

export type Period = "1" | "3" | "6";
export const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "1", label: "Son Ay" },
  { value: "3", label: "3 Ay" },
  { value: "6", label: "6 Ay" },
];

/** Tamamlanmış tam dönemler (güncel dönem hariç: okumalar sürüyor). */
const COMPLETE = PERIODS_12.slice(0, 11);
export const windowPeriods = (period: Period, shift = 0) => {
  const n = Number(period);
  const end = COMPLETE.length - shift * n;
  return COMPLETE.slice(Math.max(0, end - n), end);
};

export function periodStats(period: Period) {
  const now = windowPeriods(period);
  const before = windowPeriods(period, 1);
  const usage = (list: readonly string[]) => READINGS.filter((r) => list.includes(r.period) && r.status !== "bekliyor").reduce((s, r) => s + r.usage.total, 0);
  const billed = (list: readonly string[]) => INVOICES.filter((i) => list.includes(i.period)).reduce((s, i) => s + i.total, 0);
  /** Tahsilat oranı yalnız VADESİ GELMİŞ faturalarda: yeni kesilen fatura henüz ödenmemiş diye oranı düşürmez. */
  const matured = (list: readonly string[]) => INVOICES.filter((i) => list.includes(i.period) && i.due < TODAY_KEY);
  const maturedTotal = (list: readonly string[]) => matured(list).reduce((s, i) => s + i.total, 0);
  const collected = (list: readonly string[]) => matured(list).reduce((s, i) => s + i.paid, 0);
  const lossNow = now.flatMap((p) => regionLoss(p));
  const lossBefore = before.flatMap((p) => regionLoss(p));
  const lossPct = (rows: ReturnType<typeof regionLoss>) => pct(rows.reduce((s, x) => s + x.lossKwh, 0), rows.reduce((s, x) => s + x.input, 0));
  const active = CUSTOMERS.filter((c) => c.status === "aktif").length;
  return {
    periods: now,
    usage: usage(now),
    usageBefore: usage(before),
    billed: billed(now),
    billedBefore: billed(before),
    collectionRate: pct(collected(now), maturedTotal(now)),
    collectionBefore: pct(collected(before), maturedTotal(before)),
    lossPct: lossPct(lossNow),
    lossBefore: lossPct(lossBefore),
    active,
    unreadable: METERS.filter((m) => m.status === "iletisim-yok" || m.status === "arizali").length,
    openOutages: OPEN_OUTAGES.length,
  };
}
export type PeriodStats = ReturnType<typeof periodStats>;

/** Ağ yük eğrisi, MW: o günün saatlik toplamı; ortalama = tüketimden türer. */
export function loadCurve(offsetDays: number) {
  const avgKw = CUSTOMERS.reduce((s, c) => s + c.baseKwh, 0) / 720;
  const rand = seeded(hashSeed(`curve:${offsetDays}`));
  const weekend = [0, 6].includes(addDays(TODAY, -offsetDays).getDay());
  return Array.from({ length: 24 }, (_, h) => {
    const base = 0.62 + 0.42 * Math.exp(-((h - 10) ** 2) / 14) + 0.55 * Math.exp(-((h - 20) ** 2) / 9) - (weekend ? 0.06 : 0);
    return Math.round(((avgKw * base * between(rand, 0.96, 1.04)) / 1000) * 100) / 100;
  });
}

/** Sistem durumu (baş uç ve ağ geçitleri). */
export const SYSTEMS: readonly { id: string; label: string; status: "operational" | "degraded" | "outage" | "maintenance" }[] = [
  { id: "ami", label: "AMI Baş Uç Sistemi", status: "operational" },
  { id: "gsm", label: "GSM Haberleşme Ağ Geçidi", status: "degraded" },
  { id: "sms", label: "SMS ve Bildirim Servisi", status: "operational" },
  { id: "pay", label: "Ödeme Ağ Geçidi", status: "operational" },
  { id: "scada", label: "SCADA Veri Aktarımı", status: "maintenance" },
];

/** Bildirim akışı için tohum (zil). */
export const NOTICES = [
  { id: "n1", title: `${OPEN_OUTAGES.length} açık arıza kaydı var`, body: "Ekipler sahada", at: new Date(2026, 10, 21, 9, 52), icon: "zap" as const },
  { id: "n2", title: `${FLAGGED_READINGS.filter((r) => r.period === CURRENT_PERIOD).length} şüpheli okuma onay bekliyor`, body: "Okumalar → Şüpheli", at: new Date(2026, 10, 21, 8, 30), icon: "gauge" as const },
  { id: "n3", title: "GSM ağ geçidinde yavaşlık", body: "Yayla bölgesi sayaçları geç raporluyor", at: new Date(2026, 10, 20, 17, 5), icon: "radio" as const },
];

/** Tahsilat oranı bir dönem için (vadesi gelmiş faturalar), 0-100. */
export const collectionOf = (period: string) => {
  const rows = INVOICES.filter((i) => i.period === period && i.due < TODAY_KEY);
  return pct(rows.reduce((s, i) => s + i.paid, 0), rows.reduce((s, i) => s + i.total, 0));
};

/** Günlük açık arıza sayısı (her günün sonunda süren kayıtlar), son `days` gün, eskiden yeniye. */
export const outageDaily = (days: number) =>
  Array.from({ length: days }, (_, i) => {
    const day = addDays(TODAY, i - (days - 1));
    const start = startOfDay(day).getTime();
    const end = start + DAY_MS;
    return OUTAGES.filter((o) => o.kind === "plansiz" && o.start.getTime() < end && (o.end === null ? true : o.end.getTime() >= start)).length;
  });
