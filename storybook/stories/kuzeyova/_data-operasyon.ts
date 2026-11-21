/**
 * Portal: Tedarikçiler, Arıza ve Kesintiler, Ayarlar sayfalarının
 * türetilmiş verisi. `_data.ts` TEK kaynak kalır; burada yalnız o veriden
 * HESAPLANAN toplamlar ve bu üç sayfaya özgü ek kayıtlar (geçiş talepleri,
 * kullanıcılar, tarife geçmişi, denetim günlüğü) durur. `Date.now()` ve
 * `Math.random()` yok: her şey sabit tohumla üretilir, iki çizim aynı sonucu verir.
 */

import {
  CUSTOMERS,
  INVOICES,
  METERS,
  OUTAGES,
  FEEDERS,
  PERIODS_12,
  REGION_READ_DAYS,
  READINGS,
  REGIONS,
  SUBSTATIONS,
  SUPPLIERS,
  TODAY,
  WORK_ORDERS,
  addDays,
  customer,
  customerById,
  dayKey,
  outageMinutes,
  substation,
  supplier,
  type Customer,
  type CustomerKind,
  type Outage,
  type Supplier,
} from "./_data";
import { DEFAULT_PARAMS, computeInvoice } from "./_billing";

/* --- Küçük yardımcılar (yerel kopya: `_data.ts` bunları dışa aktarmıyor) ------ */

function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const pick = <T,>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)];
const int = (rand: () => number, lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));

/* ======================================================================== */
/* TEDARİKÇİLER                                                              */
/* ======================================================================== */

/** Grafik ve akış diyagramında kısa ad (10-12 harfi geçmez). */
export const SUPPLIER_SHORT: Record<string, string> = {
  "S-01": "Ova GTŞ",
  "S-02": "Kıvılcım",
  "S-03": "Pınar",
  "S-04": "Anadolu Işık",
  "S-05": "Gün Doğumu",
  "S-06": "Çağ",
};

/** Dağıtım bedeli, TL/kWh (`_data.ts` fatura üretimiyle aynı değerler). */
export const DIST_RATE: Record<CustomerKind, number> = { bireysel: 0.79, ticari: 0.66, sanayi: 0.31, tarim: 0.4 };
export const YEKDEM_RATE = 0.06;

const supplierOf = new Map(CUSTOMERS.map((c) => [c.id, c.supplierId]));

/** tedarikçi → dönem → tüketim kWh (okuması tamamlanan sayaçlar). */
const USAGE = (() => {
  const map = new Map<string, Map<string, number>>();
  for (const r of READINGS) {
    if (r.status === "bekliyor") continue;
    const sid = supplierOf.get(r.customerId)!;
    const byPeriod = map.get(sid) ?? new Map<string, number>();
    byPeriod.set(r.period, (byPeriod.get(r.period) ?? 0) + r.usage.total);
    map.set(sid, byPeriod);
  }
  return map;
})();

export const supplierUsage = (supplierId: string, period: string) => USAGE.get(supplierId)?.get(period) ?? 0;

/** Tedarikçinin bir dönemdeki dağıtım bedeli toplamı (abone faturalarından), kuruş. */
export const distributionBilled = (supplierId: string, period: string) =>
  INVOICES.filter((i) => i.supplierId === supplierId && i.period === period).reduce((s, i) => s + i.distribution, 0);

/**
 * Dağıtım bedeli TOPLU FATURASI: bunu dağıtım şirketi keser ve tedarikçiye
 * gönderir (`Invoice.issuer = "dagitim"`); abone faturasını tedarikçi keser. Fark:
 * toplu fatura − tedarikçinin abone faturalarındaki dağıtım bedeli toplamı;
 * bazılarında küçük bir fark var ve tedarikçi buna İTİRAZ edebilir (mutabakat).
 */
const BATCH_DELTA: Record<string, number> = { "S-03": 0.018, "S-05": -0.009 };
export const batchInvoiced = (supplierId: string, period: string) => Math.round(distributionBilled(supplierId, period) * (1 + (BATCH_DELTA[supplierId] ?? 0)));

export type SupplierRow = {
  supplier: Supplier;
  customers: number;
  free: number;
  share: number;
  usage: number;
  billed: number;
  /** Toplu fatura − abone faturaları toplamı (kuruş); 0 ise mutabık. */
  diff: number;
  collateral: number;
  receivable: number;
  daysToEnd: number;
};

export function supplierRows(period = PERIODS_12[10]): SupplierRow[] {
  const total = CUSTOMERS.length;
  return SUPPLIERS.map((s) => {
    const mine = CUSTOMERS.filter((c) => c.supplierId === s.id);
    const billed = distributionBilled(s.id, period);
    const batch = batchInvoiced(s.id, period);
    const open = INVOICES.filter((i) => i.supplierId === s.id && i.status !== "odendi");
    const receivable = open.reduce((sum, i) => sum + Math.round(i.distribution * ((i.total - i.paid) / i.total)), 0);
    const end = new Date(`${s.contractEnd}T00:00:00`);
    return {
      supplier: s,
      customers: mine.length,
      free: mine.filter((c) => c.free).length,
      share: Math.round((mine.length / total) * 1000) / 10,
      usage: supplierUsage(s.id, period),
      billed,
      diff: batch - billed,
      collateral: Math.max(100_000_00, Math.round((billed * 1.5) / 100_000_00) * 100_000_00),
      receivable,
      daysToEnd: Math.round((end.getTime() - startOfDay(TODAY).getTime()) / 86_400_000),
    };
  });
}

/** Son altı dönemin tedarikçi başına tüketimi (grafik için), MWh. */
export const supplierTrend = (supplierId: string) => PERIODS_12.slice(-6).map((p) => Math.round(supplierUsage(supplierId, p) / 100) / 10);
export const TREND_LABELS = PERIODS_12.slice(-6).map((p) => new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date(`${p}-01T00:00:00`)));

/* --- Geçiş (tedarikçi değişikliği) talepleri ------------------------------------ */

export type TransferStage = "talep" | "dogrulama" | "tarih" | "tamam";
export const TRANSFER_STAGES: readonly { id: TransferStage; label: string; hint: string }[] = [
  { id: "talep", label: "Talep Alındı", hint: "Yeni tedarikçiden gelen başvuru" },
  { id: "dogrulama", label: "Doğrulama", hint: "Borç, sözleşme ve sayaç kontrolü" },
  { id: "tarih", label: "Geçiş Tarihi Verildi", hint: "Bir sonraki okuma gününde" },
  { id: "tamam", label: "Tamamlandı", hint: "Tedarikçi güncellendi" },
];

export type Transfer = {
  id: string;
  customerId: string;
  from: string;
  to: string;
  stage: TransferStage;
  requested: string;
  effective: string | null;
  /** Doğrulamada çıkan engel (varsa): onay bu kapatılana kadar verilemez. */
  blocker: string | null;
};

export const TRANSFERS: readonly Transfer[] = (() => {
  const rand = seeded(55021);
  const free = CUSTOMERS.filter((c) => c.free);
  const stages: TransferStage[] = ["talep", "talep", "talep", "dogrulama", "dogrulama", "dogrulama", "tarih", "tarih", "tamam", "tamam"];
  return stages.map((stage, i) => {
    const c = free[(i * 7 + 3) % free.length];
    const options = SUPPLIERS.filter((s) => s.id !== c.supplierId);
    const to = pick(rand, options).id;
    const requested = dayKey(addDays(TODAY, -int(rand, 1, 20)));
    const unpaid = INVOICES.some((x) => x.customerId === c.id && x.status === "gecikti");
    return {
      id: `G-${5100 + i}`,
      customerId: c.id,
      from: c.supplierId,
      to,
      stage,
      requested,
      effective: stage === "tarih" || stage === "tamam" ? dayKey(addDays(TODAY, stage === "tamam" ? -2 : int(rand, 3, 12))) : null,
      blocker: stage === "dogrulama" && (unpaid || i % 2 === 0) ? (unpaid ? "Vadesi geçmiş fatura borcu var" : "Mevcut sözleşme taahhüt süresi dolmadı") : null,
    };
  });
})();

/** Son 12 ayda tedarikçiler arası geçen müşteri sayısı (akış diyagramı). */
export const FLOW_LINKS = (() => {
  const rand = seeded(7710);
  const links: { source: string; target: string; value: number }[] = [];
  for (const a of SUPPLIERS)
    for (const b of SUPPLIERS) {
      if (a.id === b.id) continue;
      const value = int(rand, 0, 3);
      if (value > 0) links.push({ source: a.id, target: `to-${b.id}`, value });
    }
  return links;
})();

/** Bir müşterinin tedarikçi seçenekleri: tahmini aylık fatura son üç ayın ortalamasından. */
export const COMMIT_MONTHS: Record<string, number> = { "S-01": 0, "S-02": 12, "S-03": 12, "S-04": 6, "S-05": 12, "S-06": 24 };

export function customerOffers(c: Customer) {
  const mine = READINGS.filter((r) => r.customerId === c.id && r.status !== "bekliyor").slice(-3);
  const avg = mine.length ? mine.reduce((s, r) => s + r.usage.total, 0) / mine.length : c.baseKwh;
  const multi = c.tariff === "cok-zamanli";
  const usage = multi ? { t1: avg * 0.46, t2: avg * 0.3, t3: avg * 0.24, total: avg } : { t1: avg, t2: 0, t3: 0, total: avg };
  /* Teklif, gerçek faturayla AYNI hesap çekirdeği (`_billing.ts`): dilim fiyatları, dağıtım, vergiler. */
  return SUPPLIERS.map((s) => {
    const bill = computeInvoice({ kind: c.kind, voltage: c.voltage, usage, prices: s.prices }, DEFAULT_PARAMS);
    return { supplier: s, commit: COMMIT_MONTHS[s.id], monthly: bill.total, current: s.id === c.supplierId, eligible: s.kind === "gorevli" || c.free };
  });
}

/* ======================================================================== */
/* ARIZA VE KESİNTİLER                                                      */
/* ======================================================================== */

/**
 * `_data.ts` bazı açık arızaları "bugün"ün ilerleyen bir saatinde başlatıyor
 * (başlangıç, şimdiden sonra: süre eksi çıkar). Bu sayfa kendi kopyasını
 * düzeltir: şimdiden sonra başlayan PLANSIZ kayıt, kimliğinden türeyen sabit
 * bir sürede önce başlamış sayılır. Gün ve sayılar aynı kalır.
 */
export const OUTAGE_LIST: readonly Outage[] = OUTAGES.map((o) =>
  o.kind === "plansiz" && o.start.getTime() > TODAY.getTime()
    ? { ...o, start: new Date(TODAY.getTime() - (35 + (o.id.charCodeAt(o.id.length - 1) * 7) % 140) * 60_000) }
    : o,
);
/** Süre, dakika; hiçbir zaman eksi değil. */
export const minutesOf = (o: Outage) => Math.max(0, outageMinutes(o));

export type OutageEventKind = "bildirim" | "ekip" | "sahada" | "onarildi" | "enerji";
export const OUTAGE_STEPS: readonly { id: OutageEventKind; label: string }[] = [
  { id: "bildirim", label: "Arıza bildirimi alındı" },
  { id: "ekip", label: "Ekip atandı" },
  { id: "sahada", label: "Ekip sahada" },
  { id: "onarildi", label: "Arıza onarıldı" },
  { id: "enerji", label: "Enerji verildi" },
];

/** Bir kaydın zaman çizelgesi: kayıt tamamsa beş adım da var, açıksa üçüncü adıma kadar. */
export function outageTimeline(o: Outage) {
  const base = o.start.getTime();
  const offsets = [0, 7, 24, Math.max(40, minutesOf(o) - 6), minutesOf(o)];
  const total = o.end ? 5 : Math.min(3, offsets.filter((m) => base + m * 60_000 <= TODAY.getTime()).length);
  return OUTAGE_STEPS.slice(0, total).map((step, i) => ({ ...step, at: new Date(base + offsets[i] * 60_000) }));
}

/** Etkilenen abonelerden örnek bölge listesi: bölgedeki ilk `n` müşteri (sabit sıra). */
export const affectedSample = (o: Outage, n = 8) => {
  const trs = o.transformerIds ?? [];
  const ids = new Set(METERS.filter((m) => o.feederId && FEEDERS.some((f) => f.id === o.feederId) && trs.includes(m.transformerId ?? "")).map((m) => m.customerId));
  const onFeeder = CUSTOMERS.filter((c) => ids.has(c.id));
  return (onFeeder.length ? onFeeder : CUSTOMERS.filter((c) => c.regionId === o.regionId)).slice(0, n);
};

/** SAIDI (abone başına dakika) ve SAIFI (abone başına kesinti): plansız kayıtlar, son `days` gün. */
export const LONG_OUTAGE_MINUTES = 3;
export function reliability(days: number) {
  const from = addDays(TODAY, -days).getTime();
  /* Yalnız UZUN kesintiler (> 3 dk) sayılır; payda = aktif abone sayısı (kapalı ve kesik hariç). */
  const rows = OUTAGE_LIST.filter((o) => o.kind === "plansiz" && o.start.getTime() >= from && o.start.getTime() <= TODAY.getTime() && minutesOf(o) > LONG_OUTAGE_MINUTES);
  const total = CUSTOMERS.filter((c) => c.status === "aktif").length;
  const minutes = rows.reduce((s, o) => s + o.affected * minutesOf(o), 0);
  const events = rows.reduce((s, o) => s + o.affected, 0);
  const resolved = rows.filter((o) => o.status === "cozuldu");
  const mttr = resolved.length ? Math.round(resolved.reduce((s, o) => s + minutesOf(o), 0) / resolved.length) : 0;
  return { saidi: Math.round((minutes / total) * 10) / 10, saifi: Math.round((events / total) * 100) / 100, mttr, count: rows.length };
}

/** Bölgeye göre son 30 günün plansız kesinti sayısı ve toplam süresi (dakika). */
export const outageByRegion = () =>
  REGIONS.map((r) => {
    const rows = OUTAGE_LIST.filter((o) => o.kind === "plansiz" && o.regionId === r.id);
    return { region: r, count: rows.length, minutes: rows.reduce((s, o) => s + minutesOf(o), 0) };
  });

export const CREWS = ["Ekip A (Merkez)", "Ekip B (Kıyı)", "Ekip C (Vadi)", "Ekip D (Ova)", "Ekip E (Yayla)", "Ekip F (Sanayi)", "Ekip G (Yedek)"];

/** Arıza SMS şablonu: değişkenler {bolge}, {sure}. */
export const OUTAGE_SMS = "Kuzeyova Dagitim: {bolge} bolgesinde ariza nedeniyle elektrik kesintisi var. Ekiplerimiz calisiyor, tahmini sure {sure}. Bilgi: 0850 000 00 00";

export const workOrderCounts = () => ({
  open: WORK_ORDERS.filter((w) => w.status === "planlandi").length,
  done: WORK_ORDERS.filter((w) => w.status === "tamamlandi").length,
});

export const substationName = (id: string) => substation(id).name;
export { customer, customerById, supplier, METERS, SUBSTATIONS };

/* ======================================================================== */
/* AYARLAR                                                                   */
/* ======================================================================== */

export type RoleId = "yonetici" | "okuma" | "tahsilat" | "musteri" | "denetci";
export const ROLES: readonly { id: RoleId; label: string; hint: string }[] = [
  { id: "yonetici", label: "Yönetici", hint: "Bütün modüller, ayarlar ve kullanıcı yönetimi" },
  { id: "okuma", label: "Okuma Sorumlusu", hint: "Sayaç, okuma ve ham veri" },
  { id: "tahsilat", label: "Tahsilat", hint: "Fatura, ödeme ve ödeme planı" },
  { id: "musteri", label: "Müşteri Hizmetleri", hint: "Müşteri kaydı, itiraz ve arıza bildirimi" },
  { id: "denetci", label: "Denetçi", hint: "Yalnız okuma; denetim günlüğünü görür" },
];

export type SettingsUser = { id: string; name: string; email: string; role: RoleId; twoFactor: boolean; lastLogin: string; active: boolean };
export const USERS: readonly SettingsUser[] = [
  { id: "u-1", name: "Aylin Yıldırım", email: "aylin.yildirim@kuzeyova-dagitim.example", role: "yonetici", twoFactor: true, lastLogin: "2026-11-21T08:42", active: true },
  { id: "u-8", name: "Mert Aksoy", email: "mert.aksoy@kuzeyova-dagitim.example", role: "yonetici", twoFactor: true, lastLogin: "2026-11-20T17:15", active: true },
  { id: "u-2", name: "Kerem Şahin", email: "kerem.sahin@kuzeyova-dagitim.example", role: "okuma", twoFactor: true, lastLogin: "2026-11-21T07:58", active: true },
  { id: "u-3", name: "Selin Akgül", email: "selin.akgul@kuzeyova-dagitim.example", role: "tahsilat", twoFactor: true, lastLogin: "2026-11-20T17:31", active: true },
  { id: "u-4", name: "Burak Tunç", email: "burak.tunc@kuzeyova-dagitim.example", role: "musteri", twoFactor: false, lastLogin: "2026-11-20T16:05", active: true },
  { id: "u-5", name: "Derya Kalkan", email: "derya.kalkan@kuzeyova-dagitim.example", role: "okuma", twoFactor: true, lastLogin: "2026-11-19T09:12", active: true },
  { id: "u-6", name: "Okan Demirtaş", email: "okan.demirtas@kuzeyova-dagitim.example", role: "denetci", twoFactor: true, lastLogin: "2026-11-14T13:20", active: true },
  { id: "u-7", name: "Nilay Özer", email: "nilay.ozer@kuzeyova-dagitim.example", role: "tahsilat", twoFactor: false, lastLogin: "2026-10-30T10:04", active: false },
];

export type Permission = { id: string; label: string; hint: string; locked?: boolean };
export const PERMISSIONS: readonly Permission[] = [
  { id: "musteri", label: "Müşteri Kaydı ve Düzenleme", hint: "Abone aç, kapat, bilgi güncelle" },
  { id: "sayac", label: "Sayaç Tanımlama ve Değişim", hint: "Seri no, çarpan, trafo oranı" },
  { id: "okuma", label: "Okuma Onayı ve Düzeltme", hint: "Şüpheli okumayı onayla ya da düzelt" },
  { id: "hamveri", label: "Ham Veri Görüntüleme", hint: "15 dakikalık yük profili, dışa aktarma" },
  { id: "fatura", label: "Fatura İptal ve İtiraz", hint: "İtirazı kapat, düzeltme faturası kes" },
  { id: "odeme", label: "Ödeme ve Mutabakat", hint: "Tahsilat gir, mutabakatı onayla" },
  { id: "kesme", label: "Kesme ve Bağlama Emri", hint: "Borçtan enerji kesme, yeniden bağlama" },
  { id: "tarife", label: "Tarife ve Bedel Değiştirme", hint: "Yürürlük tarihi ile birlikte", locked: false },
  { id: "kullanici", label: "Kullanıcı ve Rol Yönetimi", hint: "Yalnız yöneticide; kapatılamaz", locked: true },
];

/** Başlangıç yetkileri: satır = izin, değer = rol kimlikleri. */
export const PERMISSION_START: Record<string, readonly RoleId[]> = {
  musteri: ["yonetici", "musteri"],
  sayac: ["yonetici", "okuma"],
  okuma: ["yonetici", "okuma"],
  hamveri: ["yonetici", "okuma", "denetci"],
  fatura: ["yonetici", "tahsilat", "musteri"],
  odeme: ["yonetici", "tahsilat"],
  kesme: ["yonetici", "tahsilat"],
  tarife: ["yonetici"],
  kullanici: ["yonetici"],
};

export type Tariff = { id: string; label: string; unit: string; value: number; effective: string; by: string; note: string };
export const TARIFFS_START: readonly Tariff[] = [
  { id: "dist-bireysel", label: "Dağıtım Bedeli, Konut", unit: "TL/kWh", value: DIST_RATE.bireysel, effective: "2026-07-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı" },
  { id: "dist-ticari", label: "Dağıtım Bedeli, Ticarethane", unit: "TL/kWh", value: DIST_RATE.ticari, effective: "2026-07-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı" },
  { id: "dist-sanayi", label: "Dağıtım Bedeli, Sanayi", unit: "TL/kWh", value: DIST_RATE.sanayi, effective: "2026-07-01", by: "Aylin Yıldırım", note: "OG abone" },
  { id: "dist-tarim", label: "Dağıtım Bedeli, Tarımsal Sulama", unit: "TL/kWh", value: DIST_RATE.tarim, effective: "2026-07-01", by: "Aylin Yıldırım", note: "Sulama sezonu tarifesi" },
  { id: "yekdem", label: "YEKDEM Bedeli", unit: "TL/kWh", value: YEKDEM_RATE, effective: "2026-10-01", by: "Selin Akgül", note: "Aylık ilan edilen birim bedel" },
  { id: "fon-konut", label: "Enerji Fonu, Konut", unit: "% (enerji bedeli)", value: 3, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı" },
  { id: "fon-diger", label: "Enerji Fonu, Diğer Aboneler", unit: "% (enerji bedeli)", value: 1, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı" },
  { id: "btv", label: "Belediye Tüketim Vergisi, Konut ve Ticarethane", unit: "% (enerji + dağıtım)", value: 5, effective: "2025-01-01", by: "Aylin Yıldırım", note: "Sanayide %1, tarımda yok" },
  { id: "kdv", label: "KDV, Konut ve Ticarethane", unit: "%", value: 20, effective: "2025-01-01", by: "Aylin Yıldırım", note: "Tarımsal sulamada %10" },
  { id: "gecikme", label: "Gecikme Zammı", unit: "% (aylık)", value: 2.5, effective: "2024-01-01", by: "Selin Akgül", note: "ÖRNEK PARAMETRE · vade sonrası gün bazlı, tarih aralıklı oran tablosu" },
  { id: "iletim", label: "İletim (Sistem Kullanım) Bedeli", unit: "TL/kWh", value: DEFAULT_PARAMS.transmission, effective: "2026-07-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · faturada dağıtım kaleminin içinde" },
  { id: "reaktif-endukt", label: "Reaktif Sınır, Endüktif", unit: "% (aktife oran)", value: DEFAULT_PARAMS.reactiveInductiveLimit * 100, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı; konut muaf" },
  { id: "reaktif-kapasitif", label: "Reaktif Sınır, Kapasitif", unit: "% (aktife oran)", value: DEFAULT_PARAMS.reactiveCapacitiveLimit * 100, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · doğrulanmalı" },
  { id: "reaktif-bedel", label: "Aşan Reaktif Bedeli", unit: "TL/kVArh", value: DEFAULT_PARAMS.reactiveRate, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE" },
  { id: "guc-asim", label: "Sözleşme Gücü Aşım Bedeli", unit: "TL/kW", value: DEFAULT_PARAMS.powerOverRate, effective: "2025-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · yalnız OG" },
  { id: "t2-carpan", label: "Puant (T2) Fiyat Çarpanı", unit: "× T1", value: DEFAULT_PARAMS.zoneMultiplier.t2, effective: "2025-01-01", by: "Aylin Yıldırım", note: `ÖRNEK PARAMETRE · ${DEFAULT_PARAMS.zoneHours.t2}` },
  { id: "t3-carpan", label: "Gece (T3) Fiyat Çarpanı", unit: "× T1", value: DEFAULT_PARAMS.zoneMultiplier.t3, effective: "2025-01-01", by: "Aylin Yıldırım", note: `ÖRNEK PARAMETRE · ${DEFAULT_PARAMS.zoneHours.t3}` },
  { id: "serbest-limit", label: "Serbest Tüketici Yıllık Sınırı", unit: "kWh/yıl", value: 3000, effective: "2026-01-01", by: "Aylin Yıldırım", note: "ÖRNEK PARAMETRE · yıllık tüketime göre belirlenir, doğrulanmalı" },
];

export type TariffChange = { id: string; label: string; from: number; to: number; effective: string; by: string };
export const TARIFF_HISTORY: readonly TariffChange[] = [
  { id: "h1", label: "YEKDEM Bedeli", from: 0.05, to: 0.06, effective: "2026-10-01", by: "Selin Akgül" },
  { id: "h2", label: "Dağıtım Bedeli, Konut", from: 0.74, to: 0.79, effective: "2026-07-01", by: "Aylin Yıldırım" },
  { id: "h3", label: "Dağıtım Bedeli, Ticarethane", from: 0.62, to: 0.66, effective: "2026-07-01", by: "Aylin Yıldırım" },
  { id: "h4", label: "YEKDEM Bedeli", from: 0.07, to: 0.05, effective: "2026-07-01", by: "Selin Akgül" },
];

export const READERS = ["Kerem Şahin", "Derya Kalkan", "Mehmet Aral", "Esin Çakır", "Volkan Tosun", "Gül Ersoy"];
export const READ_ROUTES_START = REGIONS.map((r, i) => ({
  regionId: r.id,
  reader: READERS[i],
  day: REGION_READ_DAYS[r.id][0],
  days: REGION_READ_DAYS[r.id].join(", "),
  meters: METERS.filter((m) => customer(m.customerId).regionId === r.id).length,
}));

export type Template = { id: string; label: string; channel: "sms" | "mail" | "both"; body: string; active: boolean };
export const TEMPLATE_VARS = ["{abone_no}", "{ad}", "{donem}", "{tutar}", "{son_odeme}", "{bolge}", "{sure}", "{tarih}"] as const;
export const TEMPLATE_SAMPLE: Record<string, string> = {
  "{abone_no}": "1048 2237 90",
  "{ad}": "Ayşe Yılmaz",
  "{donem}": "Kasım 2026",
  "{tutar}": "1.284,60 ₺",
  "{son_odeme}": "5 Aralık",
  "{bolge}": "Vadi",
  "{sure}": "2 saat",
  "{tarih}": "24 Kasım, 09:00-13:00",
};
export const TEMPLATES_START: readonly Template[] = [
  { id: "fatura", label: "Fatura Kesildi", channel: "both", active: true, body: "Sayin {ad}, {abone_no} numarali tesisatinizin {donem} faturasi {tutar}. Son odeme tarihi {son_odeme}." },
  { id: "vade", label: "Vade Hatırlatma", channel: "sms", active: true, body: "Sayin {ad}, {tutar} tutarindaki faturanizin son odeme gunu {son_odeme}. Odeme icin: portal." },
  { id: "ariza", label: "Arıza Bildirimi", channel: "sms", active: true, body: "{bolge} bolgesinde ariza nedeniyle elektrik kesintisi var. Ekiplerimiz calisiyor, tahmini sure {sure}." },
  { id: "planli", label: "Planlı Kesinti Duyurusu", channel: "both", active: true, body: "Bakim calismasi nedeniyle {tarih} tarihinde {bolge} bolgesinde elektrik kesilecektir. Anlayisiniz icin tesekkur ederiz." },
  { id: "odeme", label: "Ödeme Alındı", channel: "mail", active: true, body: "Sayin {ad}, {abone_no} numarali tesisat icin {tutar} tutarindaki odemeniz alinmistir." },
  { id: "okuma", label: "Okuma Hatırlatma", channel: "sms", active: false, body: "Sayin {ad}, sayaciniz {tarih} tarihinde okunacaktir. Sayacin erisilebilir olmasi gerekir." },
];

export type IntegrationId = "ami" | "sms" | "pay" | "efatura" | "kurum";
export const INTEGRATIONS: readonly { id: IntegrationId; name: string; category: string; description: string; connected: boolean; lastSync: string; setup: string; systemId?: string }[] = [
  { id: "ami", name: "AMI Baş Uç Sistemi", category: "Sayaç okuma", description: "Uzaktan okunan sayaçların endeks ve yük profili verisini alır.", connected: true, lastSync: "4 dk önce", setup: "Ücretsiz · yerleşik", systemId: "ami" },
  { id: "sms", name: "SMS ve Bildirim Servisi", category: "İletişim", description: "Fatura, arıza ve planlı kesinti duyurularını abonelere gönderir.", connected: true, lastSync: "1 dk önce", setup: "Ücretsiz · yerleşik", systemId: "sms" },
  { id: "pay", name: "Ödeme Ağ Geçidi", category: "Tahsilat", description: "Banka, PTT ve online ödemeleri mutabakat için içeri aktarır.", connected: true, lastSync: "12 dk önce", setup: "Ücretsiz · yerleşik", systemId: "pay" },
  { id: "efatura", name: "E-Fatura Entegratörü", category: "Mali", description: "Kesilen faturaları e-fatura ve e-arşiv olarak iletir.", connected: false, lastSync: "", setup: "Sözleşme gerekir · 1 gün" },
  { id: "kurum", name: "Kurum Bildirim Servisi", category: "Düzenleme", description: "Kesinti ve kalite göstergelerini düzenleyici kuruma iletir.", connected: false, lastSync: "", setup: "Yetki belgesi gerekir · 2 gün" },
];

/* --- Denetim günlüğü -------------------------------------------------------------- */

export type AuditEntry = { id: string; at: Date; user: string; action: string; target: string; ip: string; ok: boolean };
export const AUDIT_ACTIONS = ["Okuma onayladı", "Okumayı düzeltti", "Fatura itirazını kapattı", "Tarife güncelledi", "Sayaç değiştirdi", "Kullanıcı davet etti", "Rapor indirdi", "Kesme emri oluşturdu", "Giriş yaptı", "Şablon düzenledi", "Mutabakatı onayladı", "Müşteri kaydetti"] as const;

export const AUDIT_LOG: readonly AuditEntry[] = (() => {
  const rand = seeded(90210);
  const rows: AuditEntry[] = [];
  let at = TODAY.getTime();
  for (let i = 0; i < 48; i++) {
    at -= int(rand, 14, 190) * 60_000;
    const u = pick(rand, USERS.filter((x) => x.active));
    const action = pick(rand, AUDIT_ACTIONS);
    const c = pick(rand, CUSTOMERS);
    const target =
      action === "Giriş yaptı" ? "Portal"
      : action === "Tarife güncelledi" ? pick(rand, TARIFFS_START).label
      : action === "Şablon düzenledi" ? pick(rand, TEMPLATES_START).label
      : action === "Kullanıcı davet etti" ? "Yeni kullanıcı"
      : action === "Rapor indirdi" ? "Aylık tahakkuk raporu"
      : action === "Mutabakatı onayladı" ? `Ödeme ${c.id}`
      : `${c.id} · ${c.name}`;
    // Rol dışı bir işlem: denetçi ya da müşteri hizmetleri tarife değiştirmeyi dener, reddedilir.
    const denied = (u.role === "denetci" && action !== "Giriş yaptı" && action !== "Rapor indirdi") || (u.role === "musteri" && action === "Tarife güncelledi");
    rows.push({ id: `L-${9000 + i}`, at: new Date(at), user: u.name, action, target, ip: `10.24.${int(rand, 1, 9)}.*`, ok: !denied });
  }
  return rows;
})();
