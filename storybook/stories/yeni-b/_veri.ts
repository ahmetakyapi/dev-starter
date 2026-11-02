import type { CalendarEvent } from "@/components/ui/week-calendar";
import type { KanbanColumn } from "@/components/ui/kanban-board";
import type { ScatterPoint } from "@/components/ui/scatter-chart";
import type { Task } from "@/components/ui/task-list";

/**
 * Bu klasörün örnek verisi. Senaryo tek: "Pusula" adlı bir SaaS ürününün
 * ekibi. Kayıt kanalları, ciro ve dönüşüm, kampanyalar, sprint panosu,
 * haftalık toplantılar ve kişisel görevler birbirine uyar (aynı kişiler,
 * aynı hafta). "Bugün" sabit: 4 Kasım 2026 Çarşamba, 11:20 — görüntüler
 * her derlemede aynı çıksın.
 */

export const BUGUN = "2026-11-04";
export const SIMDI = "2026-11-04T11:20";
export const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;

const sayiBicim = new Intl.NumberFormat("tr-TR");
export const sayi = (v: number) => sayiBicim.format(v);
export const toplam = (v: readonly number[]) => v.reduce((a, b) => a + b, 0);

/* ---------- Çizgi grafiği: kanala göre aylık yeni kayıt ---------- */

export const KANAL_KAYIT = [
  { label: "Organik", values: [1240, 1310, 1420, 1380, 1560, 1690, 1640, 1810, 1950, 2080, 2210, 2350], series: 1 },
  { label: "Reklam", values: [860, 940, 1120, 990, 1180, 1320, 1210, 1260, 1410, 1480, 1620, 1710], series: 2 },
  { label: "Referans", values: [420, 450, 510, 560, 590, 640, 700, 760, 820, 910, 960, 1040], series: 3 },
  { label: "E-Posta", values: [320, 420, 510, 480, 650, 770, 630, 820, 940, 1010, 1100, 1170], series: 4 },
] as const;

/** Aylık toplam kayıt hedefi (dört kanal ayrı ayrı değil, en güçlü kanalın hedefi). */
export const ORGANIK_HEDEF = 2000;

/* Haftalık aktif kullanıcı: gerçekleşen ve tahmin (kesik) */
export const HAFTALAR = ["1. Hf", "2. Hf", "3. Hf", "4. Hf", "5. Hf", "6. Hf", "7. Hf", "8. Hf"] as const;
export const AKTIF_GERCEK = [8420, 8610, 8950, 9120, 9380, 9710, 9860, 10240] as const;
export const AKTIF_TAHMIN = [8400, 8700, 9000, 9300, 9600, 9900, 10200, 10500] as const;

/* ---------- Birleşik grafik: aylık ciro (₺) ve dönüşüm oranı ---------- */

export const CIRO = [412000, 468000, 531000, 498000, 574000, 621000, 589000, 655000, 712000, 768000, 934000, 1086000] as const;
export const DONUSUM = [0.021, 0.023, 0.026, 0.024, 0.027, 0.029, 0.027, 0.03, 0.031, 0.033, 0.038, 0.041] as const;
export const SIPARIS = [1820, 1960, 2240, 2110, 2380, 2520, 2410, 2690, 2840, 3010, 3620, 4180] as const;
export const IADE = [0.064, 0.061, 0.058, 0.066, 0.055, 0.052, 0.057, 0.049, 0.047, 0.046, 0.071, 0.083] as const;

/* ---------- Saçılım: kampanya harcaması ↔ yeni kayıt, boy = tıklama ---------- */

export const KANALLAR = [
  { key: "arama", label: "Arama Ağı", series: 1 },
  { key: "sosyal", label: "Sosyal Medya", series: 2 },
  { key: "eposta", label: "E-Posta", series: 3 },
  { key: "gorsel", label: "Görüntülü Reklam", series: 4 },
] as const;

export const KAMPANYALAR: ScatterPoint[] = [
  { label: "Marka Araması", x: 18, y: 640, size: 21400, category: "arama" },
  { label: "Rakip Kelimeleri", x: 42, y: 710, size: 28800, category: "arama" },
  { label: "Proje Yönetimi Araması", x: 31, y: 590, size: 19600, category: "arama" },
  { label: "Ücretsiz Deneme", x: 55, y: 980, size: 36200, category: "arama" },
  { label: "Kış İndirimi", x: 24, y: 310, size: 17800, category: "sosyal" },
  { label: "Kullanıcı Hikâyeleri", x: 12, y: 190, size: 9400, category: "sosyal" },
  { label: "Yeni Özellik Videosu", x: 37, y: 420, size: 26100, category: "sosyal" },
  { label: "Ekip Paketi Tanıtımı", x: 48, y: 380, size: 22500, category: "sosyal" },
  { label: "Haftalık Bülten", x: 4, y: 260, size: 6100, category: "eposta" },
  { label: "Deneme Bitiyor Hatırlatması", x: 6, y: 410, size: 7300, category: "eposta" },
  { label: "Geri Kazanım Serisi", x: 9, y: 220, size: 4800, category: "eposta" },
  { label: "Haber Siteleri", x: 33, y: 120, size: 31800, category: "gorsel" },
  { label: "Yeniden Hedefleme", x: 21, y: 340, size: 14200, category: "gorsel" },
  { label: "Sektör Portalları", x: 46, y: 160, size: 27400, category: "gorsel" },
];

/* ---------- Aktivite halkaları ---------- */

export const GUNLUK_HEDEF = [
  { label: "Hareket", value: 480, goal: 600, unit: "kcal", series: 1 },
  { label: "Egzersiz", value: 42, goal: 30, unit: "dk", series: 2 },
  { label: "Ayakta", value: 9, goal: 12, unit: "saat", series: 3 },
] as const;

export const SATIS_KOTASI = [
  { label: "Yeni Sözleşme", value: 18, goal: 15, unit: "adet", series: 4 },
  { label: "Yenileme", value: 31, goal: 40, unit: "adet", series: 5 },
  { label: "Demo Görüşmesi", value: 22, goal: 25, unit: "görüşme", series: 6 },
  { label: "Teklif", value: 12, goal: 20, unit: "teklif", series: 1 },
] as const;

/* ---------- Kanban: sprint panosu ---------- */

const ELIF = { name: "Elif Yıldız" };
const MERT = { name: "Mert Kaya" };
const DENIZ = { name: "Deniz Arslan" };
const ZEYNEP = { name: "Zeynep Çelik" };
const BURAK = { name: "Burak Şahin" };

export const SPRINT: KanbanColumn[] = [
  {
    id: "todo",
    title: "Yapılacak",
    cards: [
      { id: "PUS-142", title: "Fatura e-postasına PDF eki", tags: [{ label: "Faturalama", tone: "chart-3" }], assignee: MERT, due: "2026-11-12" },
      { id: "PUS-147", title: "Ekip davetinde rol seçimi", tags: [{ label: "Ekip", tone: "chart-1" }, { label: "Tasarım", tone: "chart-5" }], assignee: ZEYNEP, due: "2026-11-10" },
      { id: "PUS-151", title: "Karanlık temada grafik ipuçları", tags: [{ label: "Arayüz", tone: "chart-5" }], due: "2026-11-14" },
    ],
  },
  {
    id: "doing",
    title: "Sürüyor",
    limit: 3,
    cards: [
      { id: "PUS-128", title: "Ödeme sayfasında 3D Secure dönüşü", tags: [{ label: "Hata", tone: "chart-2" }, { label: "Ödeme", tone: "chart-3" }], assignee: ELIF, due: "2026-11-02" },
      { id: "PUS-133", title: "CSV dışa aktarımında Türkçe karakter", tags: [{ label: "Hata", tone: "chart-2" }], assignee: BURAK, due: "2026-11-04" },
    ],
  },
  {
    id: "review",
    title: "İncelemede",
    limit: 2,
    cards: [
      { id: "PUS-119", title: "Proje şablonları galerisi", tags: [{ label: "Özellik", tone: "chart-4" }], assignee: DENIZ, due: "2026-11-06" },
      { id: "PUS-124", title: "Bildirim tercihleri sayfası", tags: [{ label: "Ayarlar", tone: "chart-6" }], assignee: ZEYNEP, due: "2026-11-07" },
      { id: "PUS-126", title: "Mobil menüde odak tuzağı", tags: [{ label: "Erişilebilirlik", tone: "chart-1" }], assignee: MERT, due: "2026-11-03" },
    ],
  },
  {
    id: "done",
    title: "Bitti",
    done: true,
    cards: [
      { id: "PUS-110", title: "Giriş sayfasında tek kullanımlık kod", tags: [{ label: "Güvenlik", tone: "chart-6" }], assignee: ELIF, due: "2026-10-30" },
      { id: "PUS-114", title: "Aylık rapor e-postası", tags: [{ label: "Raporlama", tone: "chart-4" }], assignee: BURAK, due: "2026-11-01" },
    ],
  },
];

/* ---------- Haftalık takvim (2-8 Kasım 2026) ---------- */

export const HAFTA = "2026-11-02";

export const TOPLANTILAR: CalendarEvent[] = [
  { id: "t1", title: "Haftalık Planlama", start: "2026-11-02T09:30", end: "2026-11-02T10:30", location: "Toplantı Odası 2", series: 1 },
  { id: "t2", title: "Tasarım İncelemesi", start: "2026-11-02T14:00", end: "2026-11-02T15:30", location: "Çevrim İçi", series: 5 },
  { id: "t3", title: "Müşteri Görüşmesi: Kuzey Lojistik", start: "2026-11-03T10:00", end: "2026-11-03T11:00", location: "Çevrim İçi", series: 3 },
  { id: "t4", title: "Kod İnceleme", start: "2026-11-03T10:30", end: "2026-11-03T11:30", series: 4 },
  { id: "t5", title: "Öğle Arası", start: "2026-11-03T12:30", end: "2026-11-03T13:30", series: 6 },
  { id: "t6", title: "Günlük Eşleşme", start: "2026-11-04T09:00", end: "2026-11-04T09:15", series: 1 },
  { id: "t7", title: "Ödeme Akışı Atölyesi", start: "2026-11-04T10:00", end: "2026-11-04T12:00", location: "Atölye Salonu", series: 2 },
  { id: "t8", title: "Ürün Demosu Provası", start: "2026-11-04T11:00", end: "2026-11-04T12:00", location: "Toplantı Odası 1", series: 5 },
  { id: "t9", title: "Destek Ekibiyle Senkron", start: "2026-11-04T11:30", end: "2026-11-04T12:30", series: 3 },
  { id: "t10", title: "Birebir: Elif", start: "2026-11-04T15:00", end: "2026-11-04T15:30", series: 4 },
  { id: "t11", title: "Sprint Gözden Geçirme", start: "2026-11-05T13:00", end: "2026-11-05T14:30", location: "Toplantı Odası 2", series: 1 },
  { id: "t12", title: "İşe Alım Görüşmesi", start: "2026-11-05T16:00", end: "2026-11-05T17:00", location: "Çevrim İçi", series: 6 },
  { id: "t13", title: "Geriye Bakış", start: "2026-11-06T10:00", end: "2026-11-06T11:00", series: 1 },
  { id: "t14", title: "Yayın Penceresi", start: "2026-11-06T15:00", end: "2026-11-06T17:30", location: "Operasyon Kanalı", series: 2 },
];

/* ---------- Görev listesi ---------- */

export const GOREVLER: Task[] = [
  {
    id: "g1",
    title: "Kuzey Lojistik teklifini gönder",
    done: false,
    priority: "high",
    due: "2026-11-03",
    subtasks: [
      { id: "g1a", title: "Fiyat tablosunu güncelle", done: true },
      { id: "g1b", title: "Hukuk onayını al", done: true },
      { id: "g1c", title: "Kapak yazısını yaz", done: false },
    ],
  },
  { id: "g2", title: "Sprint gözden geçirme sunumunu hazırla", done: false, priority: "medium", due: "2026-11-04" },
  { id: "g3", title: "Deneme bitiyor e-postasının metnini düzelt", done: true, priority: "low", due: "2026-11-02" },
  {
    id: "g4",
    title: "Yeni ekip üyesi için erişimleri aç",
    done: false,
    priority: "medium",
    due: "2026-11-09",
    subtasks: [
      { id: "g4a", title: "Kod deposu", done: false },
      { id: "g4b", title: "Tasarım dosyaları", done: false },
      { id: "g4c", title: "Destek paneli", done: false },
      { id: "g4d", title: "Takvim ve kanallar", done: false },
    ],
  },
  { id: "g5", title: "Ekim faturalarını muhasebeye ilet", done: true, priority: "high", due: "2026-11-01" },
  { id: "g6", title: "Müşteri görüşmesi notlarını paylaş", done: false, priority: "low" },
];
