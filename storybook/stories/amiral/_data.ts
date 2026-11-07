/**
 * "Her Şey Bir Arada": bütün sahte veri tek yerde.
 *
 * Kurgu: Kıyı Kahve, İzmir'de nitelikli kahve kavuran altı kişilik bir
 * atölye. Üç kanaldan satar: web mağaza, kafelere toptan ve aylık abonelik.
 * Bugün 2 Kasım 2026, Pazartesi.
 *
 * TUTARLILIK İLKESİ: toplamlar elle yazılmaz, türetilir.
 *   - Kanal payı göstergesi = akış grafiğinin kaynak toplamları = ciro toplamı.
 *   - Web hunisinin son aşaması = ısı haritasında Ekim'in sipariş toplamı.
 *   - Abonelik halkasının toplamı = abonelik hunisinin "Abone" aşaması.
 *   - Kahraman karosundaki ciro = alan grafiğinin son on iki ayı.
 */

/* --- Biçim --------------------------------------------------------------- */

export const TODAY = new Date(2026, 10, 2, 9, 40);
export const num = new Intl.NumberFormat("tr-TR");
export const tlCompact = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 });
export const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
export const sum = (values: readonly number[]) => values.reduce((a, v) => a + v, 0);
/** Önceki döneme göre yüzde değişim, bir ondalık. */
export const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : 0);

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

/** Bir toplamı ağırlıklara böler; yuvarlama artığı en büyük paya gider, toplam birebir korunur. */
function split(total: number, weights: readonly number[]): number[] {
  const w = sum(weights);
  const parts = weights.map((x) => Math.floor((total * x) / w));
  const biggest = weights.indexOf(Math.max(...weights));
  parts[biggest] += total - sum(parts);
  return parts;
}

/* --- Atölye ve ekip ------------------------------------------------------ */

export const BRAND = { name: "Kıyı Kahve", city: "İzmir", domain: "kiyikahve.com.tr" } as const;

export const TEAM = [
  { name: "Ahmet Akyapı", role: "Kurucu" },
  { name: "Kerem Arıkan", role: "Kavurma Ustası" },
  { name: "Selin Başaran", role: "Toptan Satış" },
  { name: "Onur Tekin", role: "Operasyon" },
  { name: "Ece Doğan", role: "Müşteri Deneyimi" },
  { name: "Barış Güler", role: "Muhasebe" },
] as const;
export const ME = TEAM[0];

/* --- Ciro: son on iki ay, bin ₺ ----------------------------------------- */

export const MONTHS = ["Kas", "Ara", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki"] as const;
export const REVENUE_NOW = [262, 318, 241, 236, 274, 289, 305, 296, 284, 301, 338, 362] as const;
export const REVENUE_BEFORE = [198, 251, 187, 179, 206, 224, 231, 228, 219, 233, 257, 271] as const;
export const REVENUE_TOTAL = sum(REVENUE_NOW);
export const REVENUE_PREV = sum(REVENUE_BEFORE);
export const REVENUE_CHANGE = change(REVENUE_TOTAL, REVENUE_PREV);
/** Bin ₺ → "₺3,5 Mn". */
export const fromK = (k: number) => tlCompact.format(k * 1000);

/* --- Kanallar: ciro toplamının bölünmesi ------------------------------ */

export const CHANNELS = [
  { id: "web", label: "Web Mağaza", series: 2 },
  { id: "kafe", label: "Toptan", series: 3 },
  { id: "abone", label: "Abonelik", series: 1 },
] as const;
/**
 * Her ayın cirosu kanallara bölünür; abonelik ay ay pay alır, toptan pay
 * verir. Kanal toplamları bu aylık serilerden: çizgi grafiğinin serileri =
 * kanal payı göstergesi = akışın kaynakları.
 */
export const CHANNEL_MONTHLY = CHANNELS.map(() => [] as number[]);
REVENUE_NOW.forEach((month, i) => {
  split(month, [39 + i * 0.3, 42 - i * 0.7, 19 + i * 0.4]).forEach((value, c) => CHANNEL_MONTHLY[c].push(value));
});
const CHANNEL_TOTALS = CHANNEL_MONTHLY.map((values) => sum(values));
export const CHANNEL_REVENUE = CHANNELS.map((c, i) => ({ ...c, value: CHANNEL_TOTALS[i] }));

/** Ürün grubu karışımı, kanal başına (satır = kanal, sütun = grup). */
export const CATEGORIES = [
  { id: "filtre", label: "Filtre Kahve" },
  { id: "espresso", label: "Espresso Harmanı" },
  { id: "koken", label: "Tek Köken" },
  { id: "ekipman", label: "Ekipman" },
] as const;
const MIX = [
  [34, 18, 33, 15],
  [12, 71, 14, 3],
  [44, 16, 40, 0],
] as const;
export const FLOWS = CHANNEL_REVENUE.flatMap((channel, i) =>
  split(channel.value, MIX[i]).map((value, j) => ({ source: channel.id, target: CATEGORIES[j].id, value })),
).filter((link) => link.value > 0);

/* --- En çok satanlar: son 30 gün, paket ------------------------------- */

export const TOP_PRODUCTS = [
  { label: "Kıyı Harmanı · 1 kg", value: 412 },
  { label: "Etiyopya Yirgacheffe · 250 g", value: 368 },
  { label: "Kolombiya Huila · 250 g", value: 291 },
  { label: "Brezilya Cerrado · 1 kg", value: 254 },
  { label: "Kenya Nyeri AA · 250 g", value: 187 },
  { label: "Kâğıt Filtre V60 · 100 adet", value: 143 },
] as const;

/* --- Web siparişleri: son 26 hafta, günlük ----------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function dailyOrders() {
  const rand = seeded(20261102);
  const out: { date: string; value: number }[] = [];
  const end = new Date(2026, 10, 1); // dün, Pazar
  for (let i = 26 * 7 - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const autumn = d.getMonth() >= 8 ? 1.25 : 1; // Eylül'den sonra sıcak kahve mevsimi
    const base = weekend ? 18 : 33;
    const value = Math.round((base + rand() * 14) * autumn) - (rand() < 0.05 ? base : 0);
    out.push({ date: iso(d), value: Math.max(0, value) });
  }
  return out;
}
export const DAYS = dailyOrders();
export const DAYS_TOTAL = sum(DAYS.map((d) => d.value));
export const OCTOBER_ORDERS = sum(DAYS.filter((d) => d.date.startsWith("2026-10")).map((d) => d.value));
const SEPTEMBER_ORDERS = sum(DAYS.filter((d) => d.date.startsWith("2026-09")).map((d) => d.value));
export const ORDER_CHANGE = change(OCTOBER_ORDERS, SEPTEMBER_ORDERS);

/** Web hunisi, Ekim. Son aşama ısı haritasından; öncekiler ölçülen oranlarla geri hesaplanır. */
export const WEB_FUNNEL = (() => {
  const orders = OCTOBER_ORDERS;
  const checkout = Math.round(orders / 0.81);
  const cart = Math.round(checkout / 0.43);
  const product = Math.round(cart / 0.31);
  const visit = Math.round(product / 0.52);
  return [
    { label: "Ziyaret", value: visit },
    { label: "Ürün Sayfası", value: product },
    { label: "Sepete Ekleme", value: cart },
    { label: "Ödeme", value: checkout },
    { label: "Sipariş", value: orders },
  ];
})();
export const CONVERSION = Math.round((OCTOBER_ORDERS / WEB_FUNNEL[0].value) * 1000) / 10;
/** Huni kartındaki "Eylül'e göre +0,4 puan" buradan: Eylül oranı Ekim'den türetilir. */
export const CONVERSION_GAIN = 0.4;

/** Son beş tam ay: web siparişi (ısı haritasından) ve dönüşüm oranı (son ay = huni). */
export const WEB_MONTHS = (() => {
  const months = [
    { label: "Haz", key: "2026-06" },
    { label: "Tem", key: "2026-07" },
    { label: "Ağu", key: "2026-08" },
    { label: "Eyl", key: "2026-09" },
    { label: "Eki", key: "2026-10" },
  ];
  const rates = [CONVERSION - 0.9, CONVERSION - 1.1, CONVERSION - 0.7, CONVERSION - CONVERSION_GAIN, CONVERSION];
  return months.map((m, i) => ({
    label: m.label,
    orders: sum(DAYS.filter((d) => d.date.startsWith(m.key)).map((d) => d.value)),
    rate: Math.round(rates[i] * 10) / 1000,
  }));
})();

/* --- Abonelik ------------------------------------------------------------ */

export const PLANS = [
  { label: "Aylık", value: 214, series: 1 },
  { label: "İki Haftalık", value: 131, series: 4 },
  { label: "Haftalık", value: 57, series: 6 },
] as const;
export const SUBSCRIBERS = sum(PLANS.map((p) => p.value));
export const SUB_FUNNEL = [
  { label: "Deneme Paketi", value: 1180 },
  { label: "İkinci Sipariş", value: 694 },
  { label: "Abone", value: SUBSCRIBERS },
  { label: "Altı Ay ve Üstü", value: 236 },
] as const;

/* --- Kavurma: geçen hafta, kg ------------------------------------------- */

export const ROAST_WEEK = [
  { label: "Pzt", value: 182 },
  { label: "Sal", value: 214 },
  { label: "Çar", value: 198 },
  { label: "Per", value: 236 },
  { label: "Cum", value: 221 },
  { label: "Cmt", value: 96 },
  { label: "Paz", value: 0 },
] as const;
export const ROAST_TOTAL = sum(ROAST_WEEK.map((d) => d.value));
export const ROAST_TREND = [612, 655, 701, 688, 742, 790, 812, 846, 903, 958, 1021, ROAST_TOTAL] as const;
export const ROAST_PREV = ROAST_TREND[ROAST_TREND.length - 2];

/* --- Tadım profili: 100 üzerinden --------------------------------------- */

export const CUPPING_AXES = ["Asidite", "Gövde", "Tatlılık", "Aroma", "Denge", "Bitiş"] as const;
export const CUPPING = [
  { label: "Etiyopya Yirgacheffe", values: [92, 58, 84, 94, 80, 86], series: 2 },
  { label: "Brezilya Cerrado", values: [54, 88, 79, 70, 86, 74], series: 5 },
] as const;
export const cuppingAverage = (values: readonly number[]) => Math.round(sum(values) / values.length);

/**
 * Fiyat ↔ tadım puanı, son 30 gün. Paket sayıları en çok satanlar listesiyle
 * aynı; Yirgacheffe ve Cerrado'nun puanı tadım profilinin ortalaması.
 * Fiyat web mağazanın kilo fiyatı (250 g paket × 4).
 */
const topPack = (name: string) => TOP_PRODUCTS.find((p) => p.label.startsWith(name))?.value ?? 0;
export const PRICE_SCORE = [
  { label: "Kıyı Harmanı", x: 790, y: 79, size: topPack("Kıyı Harmanı"), category: "harman" },
  { label: "Gece Harmanı", x: 720, y: 76, size: 96, category: "harman" },
  { label: "Brezilya Cerrado", x: 860, y: cuppingAverage(CUPPING[1].values), size: topPack("Brezilya Cerrado"), category: "koken" },
  { label: "Kolombiya Huila", x: 1180, y: 80, size: topPack("Kolombiya Huila"), category: "koken" },
  { label: "Etiyopya Yirgacheffe", x: 1360, y: cuppingAverage(CUPPING[0].values), size: topPack("Etiyopya Yirgacheffe"), category: "koken" },
  { label: "Etiyopya Guji", x: 1440, y: 85, size: 122, category: "koken" },
  { label: "Kenya Nyeri AA", x: 1620, y: 86, size: topPack("Kenya Nyeri AA"), category: "koken" },
] as const;
export const PRICE_CATEGORIES = [
  { key: "harman", label: "Harman", series: 3 },
  { key: "koken", label: "Tek Köken", series: 2 },
] as const;

/* --- Ekim hedefleri ------------------------------------------------------ */

/** Abonelik hunisinin "Eylül'e göre %5,7"si: Eylül'deki aboneden geri hesaplanır. */
export const SUB_GROWTH = 5.7;
export const NEW_SUBSCRIBERS = SUBSCRIBERS - Math.round(SUBSCRIBERS / (1 + SUB_GROWTH / 100));
export const OCTOBER_GOALS = [
  { label: "Ciro", value: REVENUE_NOW[REVENUE_NOW.length - 1], goal: 350, unit: "bin ₺", series: 2 },
  { label: "Web Siparişi", value: OCTOBER_ORDERS, goal: 1300, unit: "sipariş", series: 3 },
  { label: "Net Yeni Abone", value: NEW_SUBSCRIBERS, goal: 30, unit: "abone", series: 1 },
] as const;

/* --- Kafeler ve siparişler --------------------------------------------- */

export const CAFES = [
  { value: "bornova", label: "Bornova Kitap Kafe" },
  { value: "alsancak", label: "Alsancak Demlik" },
  { value: "urla", label: "Urla Bağ Evi" },
  { value: "karsiyaka", label: "Karşıyaka Fırın" },
  { value: "cesme", label: "Çeşme Liman Kafe" },
  { value: "goztepe", label: "Göztepe Kooperatif" },
  { value: "buca", label: "Buca Köşe Kahvecisi" },
  { value: "seferihisar", label: "Seferihisar Sakin Kafe" },
] as const;

export type OrderStatus = "Hazırlanıyor" | "Yolda" | "Teslim Edildi" | "Gecikti";
export type Order = { id: string; customer: string; channel: string; kg: number; total: number; status: OrderStatus };

export const ORDERS: readonly Order[] = [
  { id: "KK-3192", customer: "Alsancak Demlik", channel: "Toptan", kg: 24, total: 15840, status: "Hazırlanıyor" },
  { id: "KK-3191", customer: "Mine Sezer", channel: "Web", kg: 1.5, total: 1185, status: "Yolda" },
  { id: "KK-3189", customer: "Urla Bağ Evi", channel: "Toptan", kg: 12, total: 8160, status: "Gecikti" },
  { id: "KK-3188", customer: "Tolga Ersoy", channel: "Abonelik", kg: 1, total: 690, status: "Teslim Edildi" },
  { id: "KK-3186", customer: "Bornova Kitap Kafe", channel: "Toptan", kg: 18, total: 11970, status: "Teslim Edildi" },
];

export const ORDER_TIMELINE = [
  { id: "1", at: "2026-10-30T10:12", when: "30 Ekim, 10.12", title: "Sipariş Alındı", description: "Urla Bağ Evi · 12 kg espresso harmanı", tone: "primary" as const },
  { id: "2", at: "2026-10-31T08:40", when: "31 Ekim, 08.40", title: "Kavruldu", description: "Parti 44, orta-koyu", tone: "neutral" as const },
  { id: "3", at: "2026-11-01T16:05", when: "1 Kasım, 16.05", title: "Kargo Gecikti", description: "Seferihisar aktarmasında bir gün bekledi.", tone: "warning" as const },
];

/* --- Bildirimler -------------------------------------------------------- */

const ago = (minutes: number) => new Date(TODAY.getTime() - minutes * 60_000);
export const NOTIFICATIONS = [
  { id: "n1", actor: "Selin Başaran", title: "Selin Başaran Alsancak Demlik Siparişini Onayladı", body: "24 kg · Kıyı Harmanı", at: ago(4), read: false },
  { id: "n2", actor: "Kerem Arıkan", title: "Kerem Arıkan 44. Partiyi Kavurdu", body: "Brezilya Cerrado · 36 kg", at: ago(38), read: false },
  { id: "n3", actor: "Ece Doğan", title: "Ece Doğan Bir İade Talebini Çözdü", at: ago(150), read: false },
  { id: "n4", actor: "Onur Tekin", title: "Onur Tekin Kargo Anlaşmasını Yeniledi", at: ago(60 * 22), read: true },
] as const;

/* --- Kapsam: snippets/ui dosyalarının gruplara dağılımı ---------------- */

export type GroupId = "temel" | "secim" | "form" | "katman" | "veri" | "geri" | "gezinme" | "yukleme" | "hareket" | "ajan" | "tanitim" | "grafik" | "blok";

/** Her dosya tam bir grupta. Kaynaktaki listeyle karşılaştırılır (kapsam rozeti). */
export const GROUP_OF: Record<string, GroupId> = {
  "border-beam": "hareket",
  "slot-text": "hareket",
  "scramble-text": "hareket",
  "animated-icon": "hareket",
  "morph-icon": "hareket",
  "pixel-loader": "hareket",
  terminal: "hareket",
  dial: "hareket",
  "book-cover": "hareket",
  "pattern-bg": "hareket",
  "halftone-image": "hareket",
  "mark-annotate": "hareket",
  "expandable-card": "hareket",
  "thinking-orb": "ajan",
  "tool-call": "ajan",
  reasoning: "ajan",
  "stream-text": "ajan",
  "liquid-glass": "tanitim",
  "blur-in": "tanitim",
  "hand-callout": "tanitim",
  "app-window": "tanitim",
  dock: "tanitim",
  "docking-nav": "tanitim",
  "corner-mascot": "tanitim",
  "trust-line": "tanitim",
  wallpaper: "tanitim",
  "drift-columns": "tanitim",
  "notice-deck": "tanitim",
  icon: "temel",
  "icon-button": "temel",
  "button-group": "temel",
  "copy-button": "temel",
  "code-block": "temel",
  marquee: "temel",
  "assignee-picker": "temel",
  "hold-button": "temel",
  reactions: "temel",
  "split-button": "temel",
  "selection-bar": "veri",
  "toc-nav": "gezinme",
  "product-tour": "katman",
  "time-scrubber": "form",
  "signature-pad": "form",
  kbd: "temel",
  "close-button": "temel",
  badge: "temel",
  avatar: "temel",
  divider: "temel",
  switch: "secim",
  checkbox: "secim",
  "radio-group": "secim",
  select: "secim",
  combobox: "secim",
  "segmented-control": "secim",
  chip: "secim",
  slider: "form",
  "number-field": "form",
  "input-otp": "form",
  textarea: "form",
  "tag-input": "form",
  "color-picker": "form",
  "date-calendar": "form",
  "date-picker": "form",
  "time-field": "form",
  "tick-ruler": "form",
  "file-dropzone": "form",
  "search-field": "secim",
  "toggle-group": "secim",
  input: "form",
  rating: "form",
  dialog: "katman",
  sheet: "katman",
  popover: "katman",
  tooltip: "katman",
  "dropdown-menu": "katman",
  "context-menu": "katman",
  "command-palette": "katman",
  "notification-center": "katman",
  "hover-card": "katman",
  "data-table": "veri",
  "compare-slider": "veri",
  "tree-view": "veri",
  "tree-table": "veri",
  stat: "veri",
  "digit-roll": "veri",
  sparkline: "veri",
  timeline: "veri",
  "kanban-board": "veri",
  "week-calendar": "veri",
  "task-list": "veri",
  "banner-alert": "geri",
  progress: "geri",
  meter: "geri",
  "empty-state": "geri",
  announcement: "geri",
  toast: "geri",
  tabs: "gezinme",
  breadcrumb: "gezinme",
  pagination: "gezinme",
  stepper: "gezinme",
  accordion: "gezinme",
  carousel: "gezinme",
  spinner: "yukleme",
  "loading-mark": "yukleme",
  skeleton: "yukleme",
  "text-shimmer": "yukleme",
  "route-progress": "yukleme",
  "chart-card": "grafik",
  "area-chart": "grafik",
  "bar-list": "grafik",
  "funnel-chart": "grafik",
  "gauge-chart": "grafik",
  heatmap: "grafik",
  "radar-chart": "grafik",
  "ring-chart": "grafik",
  "sankey-chart": "grafik",
  "stage-bars": "grafik",
  "track-bar-chart": "grafik",
  "line-chart": "grafik",
  "combo-chart": "grafik",
  "scatter-chart": "grafik",
  "activity-rings": "grafik",
  "app-shell": "blok",
  "chat-thread": "blok",
  "chat-composer": "blok",
  "agent-plan": "blok",
  "auth-card": "blok",
  "settings-dialog": "blok",
  "palette-switcher": "blok",
};

export const GROUPS: readonly { id: GroupId; title: string; note: string; section: string }[] = [
  { id: "temel", title: "Temel", note: "İkon, düğme, rozet, avatar: her ekranın harfleri.", section: "bilesenler" },
  { id: "secim", title: "Seçim", note: "Aç-kapa, onay, seçenek ve arama; anında etki eden kararlar.", section: "bilesenler" },
  { id: "form", title: "Form", note: "Sayıdan takvime, hepsi aynı etiket, yardım ve hata düzeninde.", section: "bilesenler" },
  { id: "katman", title: "Katmanlar", note: "Sayfanın üstüne açılanlar: odak tuzağı, Escape, odak dönüşü.", section: "bilesenler" },
  { id: "veri", title: "Veri", note: "Tablo, ağaç, sayı, pano ve ajanda; sıralanır, açılır, taşınır, ekran okuyucuya metin.", section: "bilesenler" },
  { id: "geri", title: "Geri Bildirim", note: "Durum, ilerleme, doluluk ve boşluk; renk tek işaret değil.", section: "bilesenler" },
  { id: "gezinme", title: "Gezinme", note: "Sekme, yol, sayfa ve adım: kullanıcı nerede, nereye gidebilir.", section: "bilesenler" },
  { id: "yukleme", title: "Yükleme", note: "Beklemenin beş biçimi; hareket azaltıldığında durağan.", section: "bilesenler" },
  { id: "hareket", title: "Hareket ve Doku", note: "Işık, yuvarlanan harf, kalem çizgisi, desen: her hareket bir şey söyler, hareket azaltmada durur.", section: "bilesenler" },
  { id: "ajan", title: "Yapay Zekâ", note: "Asistanın durumu, aracı, düşüncesi ve akan yanıtı; model ne yaptığını gösterir.", section: "bilesenler" },
  { id: "tanitim", title: "Tanıtım", note: "Ziyaretçiye dönük açılış sayfası: netleşen başlık, cam eylem, canlı maket, köşedeki maskot.", section: "bilesenler" },
  { id: "grafik", title: "Grafikler", note: "ChartCard kuyusunda, lejant karolarında; seri rengi yalnız --chart-*.", section: "grafikler" },
  { id: "blok", title: "Bloklar", note: "Birden çok bileşenin birleştiği hazır parçalar.", section: "bloklar" },
];
