/**
 * Pusula: bütün sahte veri tek yerde.
 *
 * Kurgu: "Kervan Tekstil" (Denizli) otellere, kafelere ve butiklere ev
 * tekstili satan altı kişilik bir ekip. Pusula onların destek + satış +
 * takvim + asistan paneli. Bugün 2 Kasım 2026, Pazartesi, 10.40.
 *
 * TUTARLILIK İLKESİ: hiçbir toplam elle yazılmaz. Siparişler ve talepler
 * tohumlu bir üreteçle (her derlemede aynı) bir kez üretilir; panodaki
 * her karo, grafik ve rapor tablosu AYNI listeden süzülüp toplanır. Ciro
 * karosu = müşteriye göre çubuk listesinin toplamı = rapor tablosunun
 * dip satırı; kanala göre gösterge = sankey'in kaynak toplamları; "3
 * sipariş gecikti" uyarısı = durumu "Gecikti" olan sipariş sayısı.
 */

/* --- Takvim ve biçim ---------------------------------------------------- */

export const TODAY = new Date(2026, 10, 2, 10, 40);
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

export const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
export const tlCompact = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  notation: "compact",
  maximumFractionDigits: 1,
});
export const num = new Intl.NumberFormat("tr-TR");
export const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
export const longDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long" });
export const monthShort = new Intl.DateTimeFormat("tr-TR", { month: "short" });
export const clock = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });
export const dateTime = (d: Date) => `${shortDate.format(d)}, ${clock.format(d)}`;
export const pct = (part: number, whole: number, digits = 1) =>
  whole ? Math.round((part / whole) * 100 * 10 ** digits) / 10 ** digits : 0;
/** Önceki döneme göre yüzde değişim, bir ondalık. */
export const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : null);

/** Tohumlu sözde rastgele (mulberry32): her derlemede aynı veri. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rand: () => number, items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let pick = rand() * total;
  for (const item of items) {
    pick -= weight(item);
    if (pick <= 0) return item;
  }
  return items[items.length - 1];
}

/* --- Ekip ve çalışma alanı ---------------------------------------------- */

export const WORKSPACE = {
  name: "Kervan Tekstil",
  city: "Denizli",
  plan: "Ekip Planı",
  seats: { used: 6, total: 8 },
  storage: {
    usedGb: 7.4,
    totalGb: 10,
    /** Dosya alanının dökümü; toplamı `usedGb` (testte değil, burada elle tutuldu: 3,1 + 2,2 + 1,4 + 0,7). */
    parts: [
      { label: "Ekler", value: 3.1, series: 2 },
      { label: "Raporlar", value: 2.2, series: 3 },
      { label: "Sohbet", value: 1.4, series: 1 },
      { label: "Yedek", value: 0.7, series: 5 },
    ],
  },
  domain: "kervantekstil.com.tr",
} as const;

export type Member = { id: string; name: string; role: string; email: string };

export const TEAM: readonly Member[] = [
  { id: "ahmet", name: "Ahmet Akyapı", role: "Destek Lideri", email: "ahmet@kervantekstil.com.tr" },
  { id: "zeynep", name: "Zeynep Kaya", role: "Destek Uzmanı", email: "zeynep@kervantekstil.com.tr" },
  { id: "mert", name: "Mert Aksoy", role: "Satış Sorumlusu", email: "mert@kervantekstil.com.tr" },
  { id: "selin", name: "Selin Arslan", role: "Satış Temsilcisi", email: "selin@kervantekstil.com.tr" },
  { id: "can", name: "Can Demir", role: "Operasyon", email: "can@kervantekstil.com.tr" },
  { id: "burak", name: "Burak Öztürk", role: "Muhasebe", email: "burak@kervantekstil.com.tr" },
];
export const ME = TEAM[0];
export const member = (id: string) => TEAM.find((m) => m.id === id) ?? TEAM[0];

/* --- Müşteriler ---------------------------------------------------------- */

export type Customer = {
  id: string;
  name: string;
  contact: string;
  city: string;
  /** Ortalama sipariş tutarı (₺) ve sipariş sıklığı ağırlığı: üretecin girdisi. */
  basket: number;
  weight: number;
  /** Kanal eğilimi: web, telefon, bayi. */
  channels: readonly [number, number, number];
};

export const CUSTOMERS: readonly Customer[] = [
  { id: "atlas", name: "Atlas Konaklama", contact: "Seda Kılıç", city: "İstanbul", basket: 17800, weight: 1.3, channels: [2, 5, 1] },
  { id: "defne", name: "Defne Otel", contact: "Ayşe Tunç", city: "Bodrum", basket: 13600, weight: 1.1, channels: [3, 4, 1] },
  { id: "ege", name: "Ege Yaşam Mağazaları", contact: "Hakan Polat", city: "Muğla", basket: 9400, weight: 1.2, channels: [1, 1, 6] },
  { id: "lavanta", name: "Lavanta Spa", contact: "Deniz Uçar", city: "Antalya", basket: 7600, weight: 0.8, channels: [5, 2, 0] },
  { id: "cinar", name: "Çınar Kafe Zinciri", contact: "Gizem Sarı", city: "Ankara", basket: 6900, weight: 1.0, channels: [5, 2, 1] },
  { id: "nehir", name: "Nehir Butik Otel", contact: "Pınar Aydın", city: "Eskişehir", basket: 5700, weight: 0.7, channels: [4, 3, 0] },
  { id: "mavi", name: "Mavi Köşk Butik", contact: "Okan Er", city: "İzmir", basket: 4600, weight: 1.1, channels: [6, 1, 1] },
  { id: "kuzey", name: "Kuzey Ev Tekstili", contact: "Emre Bulut", city: "Trabzon", basket: 3900, weight: 0.8, channels: [1, 1, 5] },
];
export const customer = (id: string) => CUSTOMERS.find((c) => c.id === id) ?? CUSTOMERS[0];

/* --- Siparişler ---------------------------------------------------------- */

export const CHANNELS = ["Web Mağaza", "Telefon", "Bayi"] as const;
export type Channel = (typeof CHANNELS)[number];
/** Grafik seri sırası: kanal → `--chart-n`. Gösterge, sankey ve ölçer aynı rengi kullanır. */
export const CHANNEL_SERIES = { "Web Mağaza": 2, Telefon: 3, Bayi: 1 } as const;

export type OrderStatus = "Hazırlanıyor" | "Yolda" | "Gecikti" | "Teslim Edildi" | "İade";
export type Order = {
  id: string;
  customerId: string;
  date: Date;
  channel: Channel;
  total: number;
  items: string;
  status: OrderStatus;
};

const PRODUCTS = [
  "Otel Havlu Seti",
  "Pamuk Nevresim Takımı",
  "Waffle Bornoz",
  "Keten Masa Örtüsü",
  "Blackout Perde Kumaşı",
  "Peştemal",
  "Yastık Kılıfı",
  "Mutfak Önlüğü",
] as const;

/** İki yıl geriye: "Yıl" dönemi önceki on iki ayla karşılaştırılır. */
const HISTORY_DAYS = 760;

function generateOrders(): Order[] {
  const rand = seeded(20261102);
  const out: Order[] = [];
  for (let back = HISTORY_DAYS - 1; back >= 0; back--) {
    const date = addDays(TODAY, -back);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const growth = 1 + ((HISTORY_DAYS - back) / HISTORY_DAYS) * 0.24;
    // Yaz sezonu (otellerin yenilemesi) ve Kasım-Aralık stoğu: iki tepe.
    const month = date.getMonth();
    const season = month >= 3 && month <= 5 ? 1.22 : month >= 9 ? 1.12 : month <= 1 ? 0.82 : 1;
    const lambda = (weekend ? 1.1 : 3.5) * growth * season;
    // Bugün yalnızca 10.40'a kadar.
    const count = back === 0 ? 2 : Math.max(0, Math.round(lambda * (0.55 + rand() * 0.9)));
    for (let k = 0; k < count; k++) {
      const c = weighted(rand, CUSTOMERS, (x) => x.weight);
      const channel = weighted(rand, CHANNELS, (ch) => c.channels[CHANNELS.indexOf(ch)]);
      const total = Math.round((c.basket * (0.45 + rand() * 1.15)) / 10) * 10;
      const product = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
      const qty = (Math.floor(rand() * 12) + 2) * 10;
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), back === 0 ? 8 + k : 8 + Math.floor(rand() * 10), Math.floor(rand() * 60));
      const age = back;
      const status: OrderStatus =
        age <= 1 ? "Hazırlanıyor" : age <= 4 ? "Yolda" : rand() < 0.04 ? "İade" : "Teslim Edildi";
      out.push({ id: "", customerId: c.id, date: at, channel, total, items: `${product} · ${qty} adet`, status });
    }
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  out.forEach((o, i) => (o.id = `SP-${String(1000 + i)}`));
  // Gecikenler: farklı müşterilerden üç sipariş, 8, 6 ve 5 gün önce verilmiş
  // (söz 4 gün: 4, 2 ve 1 gün gecikme). Hepsi aynı gün olsaydı panodaki
  // gecikme kartı üç kez "+1 Gün" yazardı; gerçek bir gün böyle dağılır.
  const seen = new Set<string>();
  for (const target of [8, 6, 5]) {
    const hit = [...out].reverse().find((o) => daysBetween(o.date, TODAY) === target && !seen.has(o.customerId));
    if (!hit) continue;
    seen.add(hit.customerId);
    hit.status = "Gecikti";
  }
  return out;
}

export const ORDERS: readonly Order[] = generateOrders();
export const DELAYED = ORDERS.filter((o) => o.status === "Gecikti").sort((a, b) => a.date.getTime() - b.date.getTime());
export const order = (id: string) => ORDERS.find((o) => o.id === id);

/** Sipariş sonucu: sankey'in hedefleri. */
export const OUTCOMES = ["Teslim Edildi", "Yolda", "İade"] as const;
export const outcomeOf = (status: OrderStatus): (typeof OUTCOMES)[number] =>
  status === "Teslim Edildi" ? "Teslim Edildi" : status === "İade" ? "İade" : "Yolda";

/* --- Mağaza trafiği (huni) ---------------------------------------------- */

export type Traffic = { visits: number; views: number; carts: number };

function generateTraffic(): Map<string, Traffic> {
  const rand = seeded(7310);
  const byDay = new Map<string, number>();
  for (const o of ORDERS) byDay.set(dayKey(o.date), (byDay.get(dayKey(o.date)) ?? 0) + 1);
  const out = new Map<string, Traffic>();
  for (let back = HISTORY_DAYS - 1; back >= 0; back--) {
    const key = dayKey(addDays(TODAY, -back));
    const orders = byDay.get(key) ?? 0;
    const carts = orders + Math.round(orders * 1.6 + rand() * 3);
    const views = carts + Math.round(carts * 2.4 + 12 + rand() * 20);
    const visits = views + Math.round(views * 1.7 + 30 + rand() * 40);
    out.set(key, { visits, views, carts });
  }
  return out;
}

export const TRAFFIC = generateTraffic();

/* --- Talepler ------------------------------------------------------------ */

export const TICKET_CHANNELS = ["E-Posta", "Telefon", "Canlı Sohbet", "Web Formu"] as const;
export type TicketChannel = (typeof TICKET_CHANNELS)[number];
export type Priority = "Acil" | "Yüksek" | "Normal" | "Düşük";
export type TicketStatus = "Açık" | "Beklemede" | "Çözüldü";
export const PRIORITIES: readonly Priority[] = ["Acil", "Yüksek", "Normal", "Düşük"];
export const STATUSES: readonly TicketStatus[] = ["Açık", "Beklemede", "Çözüldü"];
/** Adresteki karşılığı: `?status=open`. Türkçe ad ekranda, İngilizce slug adreste. */
export const STATUS_SLUG: Record<TicketStatus, string> = { Açık: "open", Beklemede: "pending", Çözüldü: "solved" };

/** Panodaki sayılar için her talebin özeti (eski günler yalnızca bununla var). */
export type TicketStub = {
  date: Date;
  channel: TicketChannel;
  firstResponseMin: number | null;
  resolved: boolean;
  satisfied: boolean;
};

export type Ticket = TicketStub & {
  id: string;
  subject: string;
  customerId: string;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  orderId?: string;
  tags: readonly string[];
  messages: number;
  watchers: readonly string[];
  preview: string;
};

type Draft = {
  back: number;
  at: string;
  subject: string;
  customerId: string | number;
  channel: TicketChannel;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  firstResponseMin: number | null;
  tags: readonly string[];
  messages: number;
  watchers?: readonly string[];
  preview: string;
  satisfied?: boolean;
  /** Sayı: DELAYED[n]'in siparişi; "son": müşterinin son siparişi. */
  order?: number | "son";
};

/* Gelen kutusunun son sekiz günü elle yazıldı; müşteri sayıysa geciken
   siparişin sahibi (siparişler üretildiği için adı burada bilinmez). */
const DRAFTS: readonly Draft[] = [
  { back: 0, at: "10:12", subject: "Siparişimiz hâlâ teslim edilmedi", customerId: 0, channel: "Telefon", priority: "Acil", status: "Açık", assignee: "ahmet", firstResponseMin: 6, tags: ["Kargo", "Gecikme"], messages: 3, watchers: ["can", "mert"], order: 0, preview: "Kargo takip numarası 4 gündür aynı aktarma merkezinde görünüyor. Hafta sonu açılışımız var." },
  { back: 0, at: "09:47", subject: "Kasım faturasında KDV iki kez yansımış", customerId: "defne", channel: "E-Posta", priority: "Yüksek", status: "Açık", assignee: "burak", firstResponseMin: 18, tags: ["Fatura"], messages: 2, watchers: ["ahmet"], order: "son", preview: "Fatura toplamı sipariş onayından 2.312 TL fazla. Düzeltilmiş faturayı bekliyoruz." },
  { back: 0, at: "09:05", subject: "Toplu yenileme için teklif rica ediyoruz", customerId: "atlas", channel: "E-Posta", priority: "Normal", status: "Açık", assignee: "mert", firstResponseMin: null, tags: ["Teklif"], messages: 1, preview: "Üç otelimizde 420 oda için havlu ve nevresim yenilemesi planlıyoruz; Aralık teslim mümkün mü?" },
  { back: 0, at: "08:31", subject: "Web mağazada ödeme adımı hata veriyor", customerId: "mavi", channel: "Canlı Sohbet", priority: "Yüksek", status: "Açık", assignee: "zeynep", firstResponseMin: 2, tags: ["Web Mağaza", "Ödeme"], messages: 6, watchers: ["can"], preview: "Kartla ödemede '3D doğrulama tamamlanamadı' uyarısı çıkıyor, iki kez denedim." },
  { back: 1, at: "17:20", subject: "Peştemal renk kartelası isteği", customerId: "lavanta", channel: "Web Formu", priority: "Düşük", status: "Beklemede", assignee: "selin", firstResponseMin: 41, tags: ["Numune"], messages: 2, preview: "Yeni spa katımız için toprak tonlarında peştemal arıyoruz, kartela gönderebilir misiniz?" },
  { back: 1, at: "15:02", subject: "Kargo gecikmesi: açılış haftası", customerId: 1, channel: "E-Posta", priority: "Acil", status: "Açık", assignee: "can", firstResponseMin: 12, tags: ["Kargo", "Gecikme"], messages: 4, watchers: ["ahmet"], order: 1, preview: "Sipariş beş gündür yolda görünüyor. Teslim tarihi için net bir gün verebilir misiniz?" },
  { back: 1, at: "11:44", subject: "Bornoz bedenleri karışık gelmiş", customerId: "nehir", channel: "Telefon", priority: "Normal", status: "Beklemede", assignee: "zeynep", firstResponseMin: 9, tags: ["İade", "Ürün"], messages: 5, order: "son", preview: "L beden yerine 30 adet M gelmiş. Değişim için kuryeyi ne zaman gönderirsiniz?" },
  { back: 2, at: "16:35", subject: "Bayi fiyat listesi güncellemesi", customerId: "ege", channel: "E-Posta", priority: "Normal", status: "Çözüldü", assignee: "mert", firstResponseMin: 33, tags: ["Fiyat"], messages: 3, satisfied: true, preview: "2027 fiyat listesini PDF olarak paylaşabilir misiniz?" },
  { back: 2, at: "10:10", subject: "Havlu dokuma sıklığı hakkında soru", customerId: "cinar", channel: "Canlı Sohbet", priority: "Düşük", status: "Çözüldü", assignee: "zeynep", firstResponseMin: 1, tags: ["Ürün"], messages: 4, satisfied: true, preview: "500 gr/m² ile 600 gr/m² arasındaki fark kurumada ne kadar?" },
  { back: 3, at: "13:25", subject: "Siparişin teslim adresi değişecek", customerId: 2, channel: "Telefon", priority: "Yüksek", status: "Beklemede", assignee: "can", firstResponseMin: 4, tags: ["Kargo"], messages: 3, order: 2, preview: "Mağaza taşındı; yeni adres Menteşe Kordon Caddesi No. 14. Kargoya iletir misiniz?" },
  { back: 3, at: "09:58", subject: "Fatura adresi yanlış görünüyor", customerId: "kuzey", channel: "Web Formu", priority: "Normal", status: "Çözüldü", assignee: "burak", firstResponseMin: 27, tags: ["Fatura"], messages: 2, satisfied: true, preview: "Faturada eski vergi dairesi yazıyor, Karadeniz VD olmalı." },
  { back: 4, at: "18:05", subject: "Hafta sonu teslimat seçeneği var mı?", customerId: "defne", channel: "Canlı Sohbet", priority: "Düşük", status: "Çözüldü", assignee: "ahmet", firstResponseMin: 1, tags: ["Kargo"], messages: 3, satisfied: true, preview: "Cumartesi resepsiyon açık, teslimat o gün yapılabilir mi?" },
  { back: 4, at: "14:12", subject: "Masa örtüsünde leke var", customerId: "cinar", channel: "E-Posta", priority: "Normal", status: "Çözüldü", assignee: "zeynep", firstResponseMin: 22, tags: ["İade", "Ürün"], messages: 5, satisfied: false, preview: "40 örtünün 6'sında aynı yerde sarı leke var; fotoğrafları ekledim." },
  { back: 4, at: "10:40", subject: "Bayi paneline giriş yapılamıyor", customerId: "ege", channel: "Telefon", priority: "Yüksek", status: "Çözüldü", assignee: "can", firstResponseMin: 3, tags: ["Hesap"], messages: 2, satisfied: true, preview: "Şifre sıfırlama e-postası gelmiyor." },
  { back: 5, at: "16:50", subject: "Logo nakışı için fiyat", customerId: "atlas", channel: "E-Posta", priority: "Normal", status: "Çözüldü", assignee: "selin", firstResponseMin: 46, tags: ["Teklif"], messages: 4, satisfied: true, preview: "Bornozlara göğüs nakışı eklenirse adet başı ne kadar artar?" },
  { back: 5, at: "11:15", subject: "Perde kumaşı numunesi ulaşmadı", customerId: "nehir", channel: "Web Formu", priority: "Düşük", status: "Çözüldü", assignee: "selin", firstResponseMin: 38, tags: ["Numune", "Kargo"], messages: 3, satisfied: true, preview: "Bir hafta önce istediğimiz numune hâlâ gelmedi." },
  { back: 5, at: "09:20", subject: "Havale bildirimi eşleşmedi", customerId: "mavi", channel: "E-Posta", priority: "Normal", status: "Çözüldü", assignee: "burak", firstResponseMin: 15, tags: ["Ödeme"], messages: 3, satisfied: true, preview: "Cuma günü yaptığımız havale siparişe yansımamış." },
  { back: 6, at: "15:30", subject: "Yastık kılıfı stok sorusu", customerId: "lavanta", channel: "Canlı Sohbet", priority: "Düşük", status: "Çözüldü", assignee: "zeynep", firstResponseMin: 2, tags: ["Stok"], messages: 2, satisfied: true, preview: "Gri yastık kılıfından 200 adet stokta var mı?" },
  { back: 6, at: "10:05", subject: "Toplu sipariş indirimi", customerId: "defne", channel: "Telefon", priority: "Normal", status: "Çözüldü", assignee: "mert", firstResponseMin: 5, tags: ["Teklif", "Fiyat"], messages: 3, satisfied: true, preview: "50.000 TL üzeri siparişte ek indirim uyguluyor musunuz?" },
  { back: 7, at: "17:45", subject: "İade kargosu kodu çalışmıyor", customerId: "kuzey", channel: "Web Formu", priority: "Normal", status: "Çözüldü", assignee: "can", firstResponseMin: 52, tags: ["İade", "Kargo"], messages: 4, satisfied: false, preview: "Verdiğiniz anlaşmalı kargo kodu şubede geçersiz dendi." },
  { back: 7, at: "12:30", subject: "Mutfak önlüğü beden tablosu", customerId: "cinar", channel: "E-Posta", priority: "Düşük", status: "Çözüldü", assignee: "selin", firstResponseMin: 31, tags: ["Ürün"], messages: 2, satisfied: true, preview: "Önlüklerin boy ölçülerini paylaşır mısınız?" },
  { back: 7, at: "09:10", subject: "E-fatura yerine e-arşiv isteği", customerId: "mavi", channel: "E-Posta", priority: "Düşük", status: "Çözüldü", assignee: "burak", firstResponseMin: 24, tags: ["Fatura"], messages: 2, satisfied: true, preview: "Şirket türümüz değişti, faturaları e-arşiv olarak kesebilir misiniz?" },
];

/** Sekiz günden eski talepler yalnızca özet olarak (pano ve raporlar için). */
const DETAIL_DAYS = 8;

function generateStubs(): TicketStub[] {
  const rand = seeded(4242);
  const out: TicketStub[] = [];
  for (let back = HISTORY_DAYS - 1; back >= DETAIL_DAYS; back--) {
    const date = addDays(TODAY, -back);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const growth = 1 + ((HISTORY_DAYS - back) / HISTORY_DAYS) * 0.18;
    const count = Math.max(0, Math.round((weekend ? 1.2 : 3.3) * growth * (0.5 + rand())));
    for (let k = 0; k < count; k++) {
      const channel = weighted(rand, TICKET_CHANNELS, (c) => ({ "E-Posta": 40, Telefon: 25, "Canlı Sohbet": 22, "Web Formu": 13 })[c]);
      // Ekip zamanla hızlandı: ilk yanıt süresi geçmişe doğru uzar.
      const slow = 1 + (back / HISTORY_DAYS) * 0.6;
      const firstResponseMin = rand() < 0.03 ? null : Math.round((channel === "Canlı Sohbet" ? 2 : 8 + rand() * 40) * slow);
      out.push({
        date,
        channel,
        firstResponseMin,
        resolved: firstResponseMin !== null && rand() < 0.94,
        satisfied: rand() < 0.86 - (back / HISTORY_DAYS) * 0.1,
      });
    }
  }
  return out;
}

function buildTickets(): Ticket[] {
  return DRAFTS.map((d, i) => {
    const [h, m] = d.at.split(":").map(Number);
    const base = addDays(TODAY, -d.back);
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    const customerId = typeof d.customerId === "number" ? (DELAYED[d.customerId]?.customerId ?? "ege") : d.customerId;
    const orderId =
      typeof d.order === "number"
        ? DELAYED[d.order]?.id
        : d.order === "son"
          ? [...ORDERS].reverse().find((o) => o.customerId === customerId && o.date < date)?.id
          : undefined;
    return {
      id: `PSL-${1186 - i}`,
      subject: d.subject,
      customerId,
      date,
      channel: d.channel,
      priority: d.priority,
      status: d.status,
      assignee: d.assignee,
      firstResponseMin: d.firstResponseMin,
      resolved: d.status === "Çözüldü",
      satisfied: d.satisfied ?? d.status !== "Çözüldü",
      orderId,
      tags: d.tags,
      messages: d.messages,
      watchers: d.watchers ?? [],
      preview: d.preview,
    };
  });
}

export const TICKETS: readonly Ticket[] = buildTickets();
export const TICKET_STUBS: readonly TicketStub[] = [...generateStubs(), ...TICKETS].sort((a, b) => a.date.getTime() - b.date.getTime());
export const ticket = (id: string) => TICKETS.find((t) => t.id === id);
export const OPEN_TICKETS = TICKETS.filter((t) => t.status !== "Çözüldü");

/** Bir talebin olay akışı: oluşturma, atama, ilk yanıt, durum. */
export function ticketEvents(t: Ticket) {
  const plus = (min: number) => new Date(t.date.getTime() + min * 60_000);
  const events: { id: string; at: Date; title: string; description?: string; tone: "neutral" | "primary" | "success" | "warning" | "danger" }[] = [
    { id: "olustu", at: t.date, title: `${t.channel} ile Geldi`, description: customer(t.customerId).contact, tone: "neutral" },
    { id: "atandi", at: plus(1), title: `${member(t.assignee).name} Kişisine Atandı`, tone: "primary" },
  ];
  if (t.firstResponseMin !== null)
    events.push({ id: "yanit", at: plus(t.firstResponseMin), title: "İlk Yanıt Gönderildi", description: `${t.firstResponseMin} dakikada`, tone: "primary" });
  if (t.status === "Beklemede") events.push({ id: "bekle", at: plus((t.firstResponseMin ?? 0) + 25), title: "Müşteri Yanıtı Bekleniyor", tone: "warning" });
  if (t.status === "Çözüldü") events.push({ id: "coz", at: plus((t.firstResponseMin ?? 0) + 140), title: "Çözüldü Olarak Kapatıldı", tone: "success" });
  if (t.priority === "Acil" && t.status === "Açık") events.push({ id: "acil", at: plus(30), title: "Acil Olarak İşaretlendi", tone: "danger" });
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/* --- Dönemler ------------------------------------------------------------ */

export type Period = "hafta" | "ay" | "yil";
export const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "hafta", label: "Hafta" },
  { value: "ay", label: "Ay" },
  { value: "yil", label: "Yıl" },
];

type Bucket = { label: string; start: Date; end: Date };
export type Window = { start: Date; end: Date; buckets: Bucket[]; label: string; prevLabel: string; caption: string };

/** [start, end) aralıkları. Hafta ve Ay bugünü içerir; Yıl son on iki TAM ay. */
export function periodWindow(period: Period, shift = 0): Window {
  if (period === "yil") {
    const endMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() - 12 * shift, 1);
    const buckets: Bucket[] = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(endMonth.getFullYear(), endMonth.getMonth() - 12 + i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { label: monthShort.format(start), start, end };
    });
    const start = buckets[0].start;
    const last = addDays(buckets[11].end, -1);
    return {
      start,
      end: buckets[11].end,
      buckets,
      label: "Son 12 Ay",
      prevLabel: "önceki 12 aya göre",
      caption: `${monthShort.format(start)} ${start.getFullYear()} – ${monthShort.format(last)} ${last.getFullYear()}`,
    };
  }
  const days = period === "hafta" ? 7 : 30;
  const end = addDays(TODAY, 1 - days * shift);
  const start = addDays(end, -days);
  const buckets: Bucket[] = Array.from({ length: days }, (_, i) => {
    const s = addDays(start, i);
    return { label: shortDate.format(s), start: s, end: addDays(s, 1) };
  });
  return {
    start,
    end,
    buckets,
    label: period === "hafta" ? "Son 7 Gün" : "Son 30 Gün",
    prevLabel: period === "hafta" ? "önceki 7 güne göre" : "önceki 30 güne göre",
    caption: `${shortDate.format(start)} – ${shortDate.format(addDays(end, -1))}`,
  };
}

const inside = (d: Date, w: { start: Date; end: Date }) => d >= w.start && d < w.end;

function sumBy<T>(list: readonly T[], key: (item: T) => string, value: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of list) map.set(key(item), (map.get(key(item)) ?? 0) + value(item));
  return map;
}

/** Bir dönemin bütün sayıları: pano, raporlar ve asistan bunu okur. */
export function periodStats(period: Period) {
  const w = periodWindow(period);
  const prev = periodWindow(period, 1);
  const orders = ORDERS.filter((o) => inside(o.date, w));
  const prevOrders = ORDERS.filter((o) => inside(o.date, prev));
  const tickets = TICKET_STUBS.filter((t) => inside(t.date, w));
  const prevTickets = TICKET_STUBS.filter((t) => inside(t.date, prev));
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const basket = orders.length ? Math.round(revenue / orders.length) : 0;
  const prevBasket = prevOrders.length ? Math.round(prevRevenue / prevOrders.length) : 0;

  const bucketSum = (win: Window, list: readonly Order[]) => win.buckets.map((b) => list.filter((o) => inside(o.date, b)).reduce((s, o) => s + o.total, 0));
  const bucketCount = <T extends { date: Date }>(win: Window, list: readonly T[]) => win.buckets.map((b) => list.filter((o) => inside(o.date, b)).length);

  const traffic = (win: { start: Date; end: Date }) => {
    const t = { visits: 0, views: 0, carts: 0 };
    for (let d = win.start; d < win.end; d = addDays(d, 1)) {
      const x = TRAFFIC.get(dayKey(d));
      if (!x) continue;
      t.visits += x.visits;
      t.views += x.views;
      t.carts += x.carts;
    }
    return t;
  };

  const byCustomer = sumBy(orders, (o) => o.customerId, (o) => o.total);
  const countByCustomer = sumBy(orders, (o) => o.customerId, () => 1);
  const channelCount = sumBy(orders, (o) => o.channel, () => 1);
  const flows = sumBy(orders, (o) => `${o.channel}→${outcomeOf(o.status)}`, () => 1);
  const ticketChannels = sumBy(tickets, (t) => t.channel, () => 1);

  const quality = (list: readonly TicketStub[]) => {
    const answered = list.filter((t) => t.firstResponseMin !== null);
    const avgFirst = answered.length ? answered.reduce((s, t) => s + (t.firstResponseMin ?? 0), 0) / answered.length : 0;
    const resolved = list.filter((t) => t.resolved).length;
    const satisfied = list.filter((t) => t.resolved && t.satisfied).length;
    const chat = list.filter((t) => t.channel === "Canlı Sohbet").length;
    return {
      total: list.length,
      answered: answered.length,
      resolved,
      satisfied,
      avgFirst: Math.round(avgFirst),
      // Radar: 0-100 puan. İlk yanıt 60 dk'da sıfır, anında 100.
      scores: [
        Math.max(0, Math.round(100 - (avgFirst / 60) * 100)),
        Math.round(pct(answered.length, list.length, 0)),
        Math.round(pct(resolved, list.length, 0)),
        Math.round(pct(satisfied, Math.max(resolved, 1), 0)),
        Math.round(pct(chat, list.length, 0) * 3),
        Math.round(100 - pct(list.filter((t) => (t.firstResponseMin ?? 999) > 45).length, list.length, 0)),
      ],
    };
  };

  return {
    period,
    window: w,
    prevWindow: prev,
    orders,
    tickets,
    revenue,
    prevRevenue,
    revenueChange: change(revenue, prevRevenue),
    orderCount: orders.length,
    orderChange: change(orders.length, prevOrders.length),
    basket,
    basketChange: change(basket, prevBasket),
    ticketCount: tickets.length,
    ticketChange: change(tickets.length, prevTickets.length),
    revenueSeries: bucketSum(w, orders),
    prevRevenueSeries: bucketSum(prev, prevOrders),
    orderSeries: bucketCount(w, orders),
    /** Dilim başına mağaza ziyareti: dönüşüm çizgisi = sipariş / ziyaret (huni kartıyla aynı oran). */
    visitSeries: w.buckets.map((b) => traffic(b).visits),
    ticketSeries: bucketCount(w, tickets),
    basketSeries: w.buckets.map((b) => {
      const list = orders.filter((o) => inside(o.date, b));
      return list.length ? list.reduce((s, o) => s + o.total, 0) / list.length : 0;
    }),
    funnel: { ...traffic(w), orders: orders.length },
    prevFunnel: { ...traffic(prev), orders: prevOrders.length },
    byCustomer: CUSTOMERS.map((c) => ({ customer: c, revenue: byCustomer.get(c.id) ?? 0, orders: countByCustomer.get(c.id) ?? 0 }))
      .filter((r) => r.orders > 0)
      .sort((a, b) => b.revenue - a.revenue),
    channels: CHANNELS.map((ch) => ({ channel: ch, orders: channelCount.get(ch) ?? 0, series: CHANNEL_SERIES[ch] })),
    flows: CHANNELS.flatMap((ch) => OUTCOMES.map((out) => ({ source: ch, target: out, value: flows.get(`${ch}→${out}`) ?? 0 }))).filter((f) => f.value > 0),
    ticketChannels: TICKET_CHANNELS.map((ch, i) => ({ channel: ch, count: ticketChannels.get(ch) ?? 0, series: ([1, 2, 3, 4] as const)[i] })),
    quality: quality(tickets),
    prevQuality: quality(prevTickets),
  };
}
export type PeriodStats = ReturnType<typeof periodStats>;

export const RADAR_AXES = ["İlk Yanıt", "Yanıtlanan", "Çözülen", "Memnuniyet", "Canlı Sohbet", "SLA Uyumu"] as const;

/** Isı haritası: dönem uzadıkça daha çok hafta. Değer: günlük sipariş sayısı. */
export const HEATMAP_WEEKS: Record<Period, number> = { hafta: 12, ay: 26, yil: 52 };
export function orderDays(weeks: number) {
  const counts = sumBy(ORDERS, (o) => dayKey(o.date), () => 1);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = addDays(TODAY, i - weeks * 7 + 1);
    return { date: dayKey(d), value: counts.get(dayKey(d)) ?? 0 };
  });
}

/** Aylık ciro hedefi (son 30 gün için); rapor ölçeri okur. */
export const MONTHLY_TARGET = 1_200_000;
/** Hedeflerin döneme ölçeği: hafta 7/30 ay, yıl on iki ay. */
export const TARGET_SCALE: Record<Period, number> = { hafta: 7 / 30, ay: 1, yil: 12 };
/** İlk yanıt hedefi: taleplerin %80'i 30 dakika içinde (rapor ilerleme çubuğuyla aynı). */
export const FIRST_REPLY_GOAL = 0.8;

/**
 * Kapanış anketi: memnun kalan 4 ya da 5 yıldız, kalmayan 2 ya da 3 verir
 * (pano "Memnun Kalan" aşamasıyla aynı tanım). Yıldız, talebin geliş
 * dakikasından türer: her derlemede ve her ekranda aynı.
 */
export const starsOf = (t: { satisfied: boolean; date: Date }) => {
  const n = Math.floor(t.date.getTime() / 60_000);
  return t.satisfied ? (n % 3 === 0 ? 4 : 5) : n % 2 ? 2 : 3;
};
export function survey(list: readonly TicketStub[]) {
  const answered = list.filter((t) => t.resolved);
  const total = answered.reduce((a, t) => a + starsOf(t), 0);
  return { count: answered.length, average: answered.length ? Math.round((total / answered.length) * 10) / 10 : 0 };
}

/* --- Takvim -------------------------------------------------------------- */

export type CalendarEvent = {
  id: string;
  title: string;
  customerId?: string;
  date: Date;
  minutes: number;
  kind: "Görüşme" | "Teslimat" | "Numune" | "İç Toplantı";
  owner: string;
  place: string;
};

const ev = (id: string, d: number, at: string, minutes: number, rest: Omit<CalendarEvent, "id" | "date" | "minutes">): CalendarEvent => {
  const [h, m] = at.split(":").map(Number);
  return { id, date: new Date(2026, 10, d, h, m), minutes, ...rest };
};

export const EVENTS: readonly CalendarEvent[] = [
  ev("e1", 2, "11:30", 30, { title: "Haftalık Destek Toplantısı", kind: "İç Toplantı", owner: "ahmet", place: "Toplantı Odası" }),
  ev("e2", 2, "14:00", 45, { title: "Toplu Yenileme Teklifi Görüşmesi", customerId: "atlas", kind: "Görüşme", owner: "mert", place: "Görüntülü Görüşme" }),
  ev("e3", 3, "10:00", 60, { title: "Açılış Öncesi Teslimat", customerId: DELAYED[0]?.customerId ?? "cinar", kind: "Teslimat", owner: "can", place: "Müşteri Adresi" }),
  ev("e4", 4, "15:30", 30, { title: "Peştemal Kartelası Sunumu", customerId: "lavanta", kind: "Numune", owner: "selin", place: "Görüntülü Görüşme" }),
  ev("e5", 5, "09:30", 45, { title: "Bornoz Değişimi Teslimatı", customerId: "nehir", kind: "Teslimat", owner: "can", place: "Müşteri Adresi" }),
  ev("e6", 6, "13:00", 60, { title: "Kasım Fiyat Listesi Gözden Geçirme", kind: "İç Toplantı", owner: "mert", place: "Toplantı Odası" }),
  ev("e7", 10, "11:00", 45, { title: "Bayi Yıllık Değerlendirme", customerId: "ege", kind: "Görüşme", owner: "mert", place: "Muğla Mağazası" }),
  ev("e8", 12, "14:30", 30, { title: "Fatura Mutabakatı", customerId: "defne", kind: "Görüşme", owner: "burak", place: "Telefon" }),
  ev("e9", 17, "10:30", 60, { title: "Yeni Sezon Numune Teslimi", customerId: "mavi", kind: "Numune", owner: "selin", place: "İzmir Showroom" }),
  ev("e10", 19, "16:00", 30, { title: "Çeyrek Kapanış Toplantısı", kind: "İç Toplantı", owner: "ahmet", place: "Toplantı Odası" }),
  ev("e11", 24, "09:00", 90, { title: "Otel Açılışı Toplu Teslimat", customerId: "atlas", kind: "Teslimat", owner: "can", place: "Atlas Pera" }),
  ev("e12", 26, "15:00", 45, { title: "Logo Nakışı Onay Görüşmesi", customerId: "atlas", kind: "Görüşme", owner: "selin", place: "Görüntülü Görüşme" }),
];

/* --- Görevler ------------------------------------------------------------ */

type BoardTone = "neutral" | "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "chart-6";
export type BoardCard = { id: string; title: string; tags?: readonly { label: string; tone?: BoardTone }[]; assignee?: { name: string }; due?: string };
export type BoardColumn = { id: string; title: string; limit?: number; done?: boolean; cards: readonly BoardCard[] };

const TASK_TONE = { Satış: "chart-2", Destek: "chart-3", Operasyon: "chart-1", Muhasebe: "chart-4" } as const;
const card = (id: string, title: string, area: keyof typeof TASK_TONE, owner: string, due: string, extra?: string): BoardCard => ({
  id,
  title,
  tags: [{ label: area, tone: TASK_TONE[area] }, ...(extra ? [{ label: extra, tone: "neutral" as const }] : [])],
  assignee: { name: member(owner).name },
  due,
});
const delayedName = (n: number) => customer(DELAYED[n]?.customerId ?? "cinar").name;

/** Ekip panosu: takvimdeki teslimat ve görüşmeler, gelen kutusundaki açık talepler. Bugün 2 Kasım. */
export const BOARD: readonly BoardColumn[] = [
  {
    id: "yapilacak",
    title: "Yapılacak",
    cards: [
      card("g1", "Atlas 420 oda teklif tablosu", "Satış", "mert", "2026-11-04", "Teklif"),
      card("g2", "Lavanta için peştemal kartelası hazırla", "Satış", "selin", "2026-11-04", "Numune"),
      card("g3", "Nehir Butik bornoz değişimi kuryesi", "Operasyon", "can", "2026-11-05", "İade"),
      card("g4", "Kasım fiyat listesi taslağı", "Satış", "mert", "2026-11-06"),
    ],
  },
  {
    id: "suruyor",
    title: "Sürüyor",
    limit: 4,
    cards: [
      card("g5", `${delayedName(0)} gecikmesi için kargoyu ara`, "Operasyon", "can", "2026-11-02", "Gecikme"),
      card("g6", "Defne Otel düzeltilmiş faturası", "Muhasebe", "burak", "2026-11-03", "Fatura"),
      card("g7", "Web mağaza 3D ödeme hatası", "Destek", "zeynep", "2026-10-31", "Ödeme"),
    ],
  },
  {
    id: "musteride",
    title: "Müşteride",
    cards: [card("g8", `${delayedName(2)} yeni teslim adresi onayı`, "Destek", "can", "2026-11-03", "Kargo")],
  },
  {
    id: "bitti",
    title: "Bitti",
    done: true,
    cards: [
      card("g9", "Ege Yaşam 2027 bayi fiyat listesi", "Satış", "mert", "2026-10-31"),
      card("g10", "Kuzey Ev vergi dairesi düzeltmesi", "Muhasebe", "burak", "2026-10-30"),
    ],
  },
];

export type MyTask = { id: string; title: string; done: boolean; priority?: "high" | "medium" | "low"; due?: string; subtasks?: readonly { id: string; title: string; done: boolean }[] };

/** Ahmet'in (Destek Lideri) bugünkü listesi. */
export const MY_TASKS: readonly MyTask[] = [
  { id: "b1", title: `${delayedName(0)} ile açılış öncesi teslimatı teyit et`, done: false, priority: "high", due: "2026-11-02" },
  {
    id: "b2",
    title: "Haftalık destek toplantısını hazırla",
    done: false,
    priority: "medium",
    due: "2026-11-02",
    subtasks: [
      { id: "b2a", title: "Geçen haftanın talep özetini çıkar", done: true },
      { id: "b2b", title: "Geciken siparişleri listeye ekle", done: true },
      { id: "b2c", title: "Gündemi ekibe gönder", done: false },
    ],
  },
  { id: "b3", title: "Asistanın gecikme e-postası taslaklarını onayla", done: false, priority: "medium", due: "2026-11-03" },
  { id: "b4", title: "Çözülen talepleri kapanış anketine aktar", done: true, priority: "low", due: "2026-11-02" },
  { id: "b5", title: "Yeni destek uzmanı için hazır yanıtları güncelle", done: false, priority: "low", due: "2026-11-09" },
];

/* --- Bildirimler (göreli zaman: bileşen "3 dk önce" yazar) --------------- */

export function notifications(now = Date.now()) {
  const ago = (min: number) => new Date(now - min * 60_000).toISOString();
  const first = TICKETS[0];
  return [
    { id: "n1", actor: member(first.assignee).name, title: `${first.id} Acil Olarak İşaretlendi`, body: `“${first.subject}” · ${customer(first.customerId).name}`, at: ago(4), read: false },
    { id: "n2", actor: "Mert Aksoy", title: "Mert Aksoy Atlas Teklifini Taslağa Ekledi", body: "420 oda · havlu ve nevresim", at: ago(38), read: false },
    { id: "n3", actor: "Burak Öztürk", title: "Burak Öztürk Düzeltilmiş Faturayı Yükledi", body: `${TICKETS[1].id} · Defne Otel`, at: ago(95), read: false },
    { id: "n4", actor: "Can Demir", title: `Can Demir ${DELAYED.length} Geciken Siparişi Kargoya Sordu`, at: ago(60 * 20), read: true },
    { id: "n5", actor: "Selin Arslan", title: "Selin Arslan Bir Randevu Ekledi", body: "Peştemal kartelası sunumu · 4 Kas, 15.30", at: ago(60 * 26), read: true },
  ];
}

/* --- Asistan ------------------------------------------------------------- */

export const ASSISTANT_MODELS = ["Fable 5", "Fable 5 Mini", "Atlas 2"] as const;

export const PLAN_STEPS = [
  { id: "oku", title: "Açık Talepleri ve Siparişleri Oku" },
  { id: "eslestir", title: "Talepleri Siparişlerle Eşleştir", detail: `${OPEN_TICKETS.length} bekleyen talep, ${DELAYED.length} geciken sipariş` },
  { id: "kargo", title: "Kargo Durumlarını Kontrol Et" },
  { id: "oncelik", title: "Müşterileri Aciliyete Göre Sırala" },
  { id: "taslak", title: "Her Müşteriye Bilgi E-postası Taslağı Yaz" },
  { id: "onay", title: "Taslakları Onayına Sun" },
] as const;

export const SUGGESTIONS = [
  "Bu haftanın satış özetini çıkar",
  "Açık talepleri önceliğe göre sırala",
  "Atlas teklifi için fiyat tablosu hazırla",
] as const;

/* --- Raporlar ------------------------------------------------------------ */

export const SAVED_REPORTS = [
  { id: "r1", tag: "Satış", title: "Haftalık Satış Özeti", body: "Kanal ve müşteri kırılımı, önceki haftayla.", period: "hafta" as Period, series: 2 as const },
  { id: "r2", tag: "Destek", title: "Talep Kalitesi", body: "İlk yanıt, çözüm ve memnuniyet puanları.", period: "ay" as Period, series: 3 as const },
  { id: "r3", tag: "Satış", title: "Aylık Ciro Raporu", body: "Hedefe göre durum ve en çok alan müşteriler.", period: "ay" as Period, series: 1 as const },
  { id: "r4", tag: "Operasyon", title: "Kargo ve Teslimat", body: "Yolda, geciken ve iade edilen siparişler.", period: "hafta" as Period, series: 4 as const },
  { id: "r5", tag: "Yönetim", title: "Yıllık Değerlendirme", body: "On iki ayın ciro ve talep eğilimi.", period: "yil" as Period, series: 5 as const },
] as const;

export const REPORT_FAQ = [
  { q: "Ciro Nasıl Hesaplanır?", a: "Dönem içinde verilen bütün siparişlerin KDV dahil toplamı; iade edilenler de sayılır, ayrıca gösterilir." },
  { q: "Pano ile Rapordaki Sayı Neden Aynı?", a: "İkisi de aynı sipariş listesini aynı dönemle süzer. Dönem seçimi panoda ve raporda ortaktır." },
  { q: "Dışa Aktarılan Dosyada Hangi Sütunlar Var?", a: "Sipariş no, tarih, müşteri, kanal, tutar ve durum. Dosya UTF-8 CSV; Excel'de Türkçe karakterler bozulmaz." },
] as const;

/* --- Ayarlar ------------------------------------------------------------- */

export const TAG_SUGGESTIONS = ["Kargo", "Gecikme", "Fatura", "Teklif", "İade", "Ürün", "Numune", "Ödeme", "Stok", "Hesap", "Fiyat", "Web Mağaza"] as const;
// token-ok: hazır renkler kullanıcı VERİSİ (etiket rengi seçici), sistem rengi değil.
export const TAG_COLORS = [
  { value: "#f59e0b", label: "Kehribar" },
  { value: "#10b981", label: "Zümrüt" },
  { value: "#3b82f6", label: "Gök Mavisi" },
  { value: "#a855f7", label: "Leylak" },
  { value: "#ef4444", label: "Kiremit" },
  { value: "#64748b", label: "Arduvaz" },
] as const;
