/**
 * Grafik hikâyelerinin ortak örnek verisi. Üç senaryo: e-ticaret mağazası,
 * SaaS ürünü, destek ekibi. Sayılar uydurma ama birbiriyle tutarlı
 * (huninin ilk aşaması = ziyaret toplamı gibi). Tohumlu üreteçler: her
 * derlemede aynı çizim, görsel kıyas kararlı kalır.
 */

export const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;
export const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/* E-ticaret: aylık ciro (bin ₺), bu yıl ve geçen yıl */
export const CIRO_BU_YIL = [412, 468, 531, 498, 574, 621, 589, 655, 712, 768, 934, 1086] as const;
export const CIRO_GECEN_YIL = [356, 381, 422, 437, 451, 498, 512, 506, 561, 604, 742, 868] as const;

/* SaaS: aylık yeni kayıt, bu yıl ve geçen yıl */
export const KAYIT_BU_YIL = [2840, 3120, 3560, 3410, 3980, 4420, 4180, 4650, 5120, 5480, 5890, 6270] as const;
export const KAYIT_GECEN_YIL = [2210, 2380, 2590, 2720, 2650, 3010, 3240, 3180, 3460, 3720, 3900, 4110] as const;

/* Destek: son 14 gün açılan bilet */
export const SON_14_GUN = ["20 Eki", "21 Eki", "22 Eki", "23 Eki", "24 Eki", "25 Eki", "26 Eki", "27 Eki", "28 Eki", "29 Eki", "30 Eki", "31 Eki", "1 Kas", "2 Kas"] as const;
export const BILET_ACILAN = [184, 172, 196, 158, 141, 62, 48, 203, 189, 177, 166, 150, 57, 41] as const;
export const BILET_COZULEN = [171, 180, 185, 166, 152, 70, 55, 188, 194, 181, 170, 158, 63, 49] as const;

/* Bu yıl kazanılan (₺, aylık) — boardui ekranındaki iz üstünde sütunlar */
export const KAZANC = [1840, 5920, 8150, 5780, 2960, 1610, 2830, 4100, 5490, 3650, 9720, 6830] as const;

/* SaaS kayıt hunisi — aşama çubukları */
export const KAYIT_HUNISI = [
  { label: "Ziyaret", value: 1180 },
  { label: "Kayıt", value: 790 },
  { label: "Aktif", value: 460 },
  { label: "Pro", value: 250 },
  { label: "Ekip", value: 120 },
  { label: "Kurumsal", value: 40 },
] as const;

/* E-ticaret ödeme hunisi */
export const ODEME_HUNISI = [
  { label: "Ürün Görüntüleme", value: 48200 },
  { label: "Sepete Ekleme", value: 14460 },
  { label: "Ödeme Başlatma", value: 7230 },
  { label: "Adres Onayı", value: 6010 },
  { label: "Sipariş", value: 4820 },
  { label: "Teslim Edildi", value: 4630 },
] as const;

/* Tarayıcıya göre ziyaretçi — halka */
export const TARAYICI = [
  { label: "Chrome", value: 275, series: 5 },
  { label: "Safari", value: 200, series: 4 },
  { label: "Firefox", value: 187, series: 3 },
  { label: "Edge", value: 173, series: 2 },
  { label: "Diğer", value: 90, series: 1 },
] as const;

/* Destek kanalları — gösterge */
export const KANAL = [
  { label: "Canlı Destek", value: 4230, series: 2 },
  { label: "E-posta", value: 3420, series: 3 },
  { label: "Telefon", value: 1350, series: 1 },
  { label: "Sosyal Medya", value: 610, series: 4 },
] as const;

/* En çok satan ürünler — sıralı liste */
export const URUNLER = [
  { label: "Kablosuz Kulak İçi Kulaklık", value: 1284 },
  { label: "Paslanmaz Çelik Termos 750 ml", value: 962 },
  { label: "Ergonomik Ofis Sandalyesi", value: 611 },
  { label: "Organik Pamuk Nevresim Takımı", value: 548 },
  { label: "Akıllı Saat Silikon Kordon", value: 497 },
  { label: "Seramik Kahve Fincanı İkili Set", value: 386 },
  { label: "Bambu Kesme Tahtası", value: 271 },
  { label: "Yoga Matı 6 mm", value: 244 },
  { label: "Masa Lambası LED", value: 198 },
  { label: "Deri Kartlık", value: 152 },
] as const;

/* Temsilci performansı — radar ekseni ve iki profil */
export const RADAR_EKSEN = ["Hız", "Çözüm", "Memnuniyet", "Doğruluk", "Empati", "Ürün Bilgisi", "Takip", "Belgeleme"] as const;
export const RADAR_EKIP_A = [92, 84, 88, 79, 90, 72, 81, 66] as const;
export const RADAR_EKIP_B = [74, 91, 82, 88, 76, 89, 70, 70] as const;

/* Kaynaktan sonuca — sankey */
export const SANKEY_KAYNAK = [
  { id: "arama", label: "Arama", series: 2 },
  { id: "sosyal", label: "Sosyal", series: 3 },
  { id: "dogrudan", label: "Doğrudan", series: 1 },
  { id: "eposta", label: "E-posta", series: 4 },
  { id: "reklam", label: "Reklam", series: 5 },
] as const;
export const SANKEY_HEDEF = [
  { id: "siparis", label: "Sipariş" },
  { id: "sepet", label: "Sepette" },
  { id: "ayrildi", label: "Ayrıldı" },
] as const;
export const SANKEY_AKIS = [
  { source: "arama", target: "siparis", value: 1240 },
  { source: "arama", target: "sepet", value: 620 },
  { source: "arama", target: "ayrildi", value: 1540 },
  { source: "sosyal", target: "siparis", value: 380 },
  { source: "sosyal", target: "sepet", value: 290 },
  { source: "sosyal", target: "ayrildi", value: 1630 },
  { source: "dogrudan", target: "siparis", value: 520 },
  { source: "dogrudan", target: "sepet", value: 410 },
  { source: "dogrudan", target: "ayrildi", value: 870 },
  { source: "eposta", target: "siparis", value: 310 },
  { source: "eposta", target: "sepet", value: 680 },
  { source: "eposta", target: "ayrildi", value: 510 },
  { source: "reklam", target: "siparis", value: 260 },
  { source: "reklam", target: "sepet", value: 340 },
  { source: "reklam", target: "ayrildi", value: 980 },
] as const;

/**
 * Günlük sayı, `weeks` hafta, `end` gününde biter (UTC). Hafta içi yoğun,
 * hafta sonu seyrek; `peak` en yoğun günün kabaca tavanı.
 */
export function gunluk({ weeks = 26, end = "2026-10-31", peak = 11, seed = 7 } = {}) {
  const out: { date: string; value: number }[] = [];
  const [y, mo, d] = end.split("-").map(Number);
  const last = Date.UTC(y, mo - 1, d);
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < weeks * 7; i++) {
    const t = last - i * 86_400_000;
    const day = new Date(t).getUTCDay();
    const weekend = day === 0 || day === 6;
    const busy = 1 + Math.sin(i / 11) * 0.5;
    const r = rand();
    const value = r < (weekend ? 0.55 : 0.12) ? 0 : Math.round(r * (weekend ? peak * 0.35 : peak) * busy);
    out.push({ date: new Date(t).toISOString().slice(0, 10), value });
  }
  return out.reverse();
}

export const toplam = (values: readonly number[]) => values.reduce((a, v) => a + v, 0);
export const yuzdeDegisim = (simdi: number, once: number) => (once === 0 ? 0 : Math.round(((simdi - once) / once) * 1000) / 10);
export const sayi = (v: number) => v.toLocaleString("tr-TR");
export const tl = (v: number) => "₺" + v.toLocaleString("tr-TR");
/** "₺10 bin" gibi kısa eksen değeri. */
export const tlKisa = (v: number) => (v >= 1000 ? `₺${(v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} bin` : `₺${v}`);
