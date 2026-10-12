import { parseFeedItem, type FeedItem } from "@/components/feed/agent-feed-core";

/**
 * Yalnız GELİŞTİRMEDE, veritabanı ya da oturum yokken `/akis`i dolduran
 * örnek öğeler. Üretimde hiç okunmaz (`app/akis/page.tsx`). Gerçek üretici
 * yazılınca bu dosya silinebilir; sayfa kendiliğinden gerçek veriye geçer.
 */

const minutesAgo = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

export function demoFeed(now: Date): FeedItem[] {
  const raw = [
    {
      id: "demo-takvim",
      lane: "needs-you",
      source: "Takvim",
      status: "Seni Bekliyor",
      title: "14:00'teki Ece toplantın müşteri ziyaretiyle çakışıyor",
      reason: "Müşteri ziyareti 13:30'a alındı. Ece perşembe 14:00'te boş.",
      createdAt: minutesAgo(now, 40),
      timeLabel: "08:02",
      priority: 3,
      body: { type: "text" },
      actions: [
        { id: "tasi", label: "Perşembe 14:00'e Taşı", emphasis: "primary", reversibility: "reversible" },
        { id: "secenekler", label: "Seçenekler", emphasis: "secondary", reversibility: "reversible" },
      ],
    },
    {
      id: "demo-posta",
      lane: "needs-you",
      source: "Posta",
      status: "Taslak Hazır",
      title: "Deniz üçüncü çeyrek teklifini bekliyor",
      reason: "Dün 16:12'de sordu. Cumaya kadar göndereceğini söylemiştin.",
      createdAt: minutesAgo(now, 55),
      timeLabel: "07:48",
      priority: 2,
      body: {
        type: "draft",
        to: "Deniz Yılmaz",
        subject: "Üçüncü çeyrek teklifi",
        text: "Merhaba Deniz,\nKonuştuğumuz teklif ekte. Fiyatlar altıncı sayfada; perşembe birlikte üzerinden geçebiliriz.\nSevgiler",
      },
      actions: [{ id: "gonder", label: "Gönder", emphasis: "primary", reversibility: "irreversible" }],
    },
    {
      id: "demo-rapor",
      lane: "suggestion",
      source: "Rapor",
      status: "Özet Hazır",
      title: "Batı bölgesi çeyrek sonuçları geldi",
      reason: "Pazartesi satış toplantısı takviminde. Kesin rakamlar gece geldi.",
      createdAt: minutesAgo(now, 90),
      timeLabel: "06:30",
      priority: 1,
      body: {
        type: "metric",
        value: "4,2 Mn ₺",
        delta: "Önceki çeyreğe göre +%12",
        note: "İzmir 1,6 Mn ₺ ile önde · Bursa %21 büyüdü",
        series: [3.2, 3.75, 4.2],
        seriesLabels: ["Ç1", "Ç2", "Ç3"],
      },
      actions: [
        { id: "paylas", label: "Ekiple Paylaş", emphasis: "primary", reversibility: "reversible" },
      ],
    },
    {
      id: "demo-yapildi",
      lane: "handled",
      source: "Takvim",
      status: "Yapıldı",
      title: "Haftalık raporu ekip kanalına gönderdim",
      reason: "Her pazartesi sabahı.",
      createdAt: minutesAgo(now, 120),
      priority: 0,
      undoToken: "demo",
      actions: [],
    },
  ];
  return raw.map(parseFeedItem).filter((item): item is FeedItem => item !== null);
}

/** Demo aksiyonlarının kullanıcıya göstereceği kapanış satırları. */
export const DEMO_SUMMARIES: Record<string, string> = {
  tasi: "Ece ile toplantıyı perşembe 14:00'e taşıdım",
  secenekler: "Üç boş zaman önerisini Ece'ye gönderdim",
  gonder: "Teklifi Deniz'e gönderdim",
  paylas: "Çeyrek özetini ekibinle paylaştım",
};
