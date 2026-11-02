import { CalendarCheck, Inbox, type LucideIcon } from "lucide-react";
import { SITE_DESCRIPTION, SITE_NAME } from "./site";

/**
 * Sayfanın BÜTÜN metni ve hero seçimi burada. Yeni bir proje bu dosyayı ve
 * `app/globals.css`teki palet bloğunu değiştirerek kendi sayfasını çıkarır;
 * bileşenlere dokunmak gerekmez.
 *
 * Bu dosya "use client" DEĞİL: hem sunucu bölümleri hem istemci yaprakları
 * okur. İkon alanları bileşen referansı taşır; istemci bileşenine prop
 * olarak GEÇİRİLMEZ (fonksiyon sınırı aşamaz), sunucuda çizilir.
 *
 * YAZIM: başlık, düğme, etiket ve künye Title Case; açıklama ve SSS yanıtı
 * cümle. Arayüz metninde uzun tire yok (`tests/content.test.ts` denetler).
 *
 * SAYILAR ÖRNEKTİR. Hero, pano, özellik demoları ve fiyatlardaki rakamlar
 * demo içindir; hepsi `sample: true` ya da `SAMPLE_NOTE` ile işaretli ve pano
 * ekranda "Örnek Veri" künyesi taşır. Gerçek veri yoksa yayına çıkmadan
 * kaldır. Uydurma kesinlik, sayfanın en hızlı kaybettiği güven.
 */

/** Ekranda örnek verinin yanında görünen künye. */
export const SAMPLE_NOTE = "Örnek Veri";

/** Kayıt ya da ürün adresi. Şablonda fiyat bölümüne iner; gerçek adresle değiştir. */
const SIGNUP_HREF = "#fiyatlar";

export type Link = { label: string; href: string };

export const nav = {
  links: [
    { label: "Özellikler", href: "#ozellikler" },
    { label: "Nasıl Çalışır", href: "#nasil" },
    { label: "Fiyatlar", href: "#fiyatlar" },
    { label: "SSS", href: "#sss" },
  ],
  // Kayıt niyetinin TEK etiketi: başlıkta, hero'da ve kapanışta aynı.
  cta: { label: "Ücretsiz Başla", href: SIGNUP_HREF },
} as const satisfies { links: readonly Link[]; cta: Link };

/* ── Hero ──────────────────────────────────────────────────────────────── */

/**
 * Sekiz hero düzeni (`components/heroes/`). Seçim tek satır: `hero.variant`.
 * Hangisinin ne zaman kullanılacağı `components/heroes/index.tsx` başında.
 */
export const HERO_VARIANTS = [
  "showcase",
  "editorial-split",
  "statement",
  "product-frame",
  "live-data",
  "bento",
  "minimal",
  "scroll-stage",
] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

export function isHeroVariant(value: unknown): value is HeroVariant {
  return typeof value === "string" && (HERO_VARIANTS as readonly string[]).includes(value);
}

export type HeroLine = { text: string; /** Degrade mürekkep: yalnızca kısa bir satırda. */ ink?: boolean };

export type HeroStat = { value: string; label: string };

export type HeroCell =
  | { kind: "stat"; value: string; label: string }
  | { kind: "feature"; title: string; body: string; icon: LucideIcon };

export type HeroImage = {
  /** `public/` altındaki yol. Dosya yoksa düzen düz bir yüzeye düşer. */
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * showcase düzeninin canlı panosu (ÖRNEK veri). Huni aşamaları büyükten
 * küçüğe; `weekly` son yedi günün kapanan talepleri, toplamı `closed.value`.
 */
export type HeroBoard = {
  sample: true;
  title: string;
  /** Ekran okuyucu özeti: pano görsel, içeriği tek cümlede. */
  label: string;
  range: string;
  funnel: { title: string; rateLabel: string; stages: readonly { label: string; value: number }[] };
  closed: { title: string; value: string; delta: string; weekly: readonly number[]; days: readonly string[] };
  thread: { title: string; pending: string; steps: readonly { label: string; time: string }[] };
};

export const hero = {
  /* VARSAYILAN `showcase`: ürünün kendisi ilk ekranda canlı duruyor
     (ekran görüntüsü değil gerçek bileşen). Ürün henüz yoksa ya da
     gösterilecek arayüz yoksa `statement` ya da `editorial-split`. */
  variant: "showcase" as HeroVariant,
  /** Parçacık arka planı (R3F). Kapalıysa yalnızca CSS ışıması kalır. */
  scene: true,
  /** Üst künye: en fazla bir tane, kısa. Boş dizgi verilirse basılmaz. */
  eyebrow: "Ekipler İçin İş Akışı",
  title: [{ text: "Dağınık İşleri" }, { text: "Tek Akışta Topla", ink: true }],
  description: SITE_DESCRIPTION,
  primary: { label: nav.cta.label, href: nav.cta.href },
  secondary: { label: "Nasıl Çalışır", href: "#nasil" },
  /** statement: başlığın altındaki tek satırlık künye. */
  meta: "Kurulum Beş Dakika · Kredi Kartı İstenmez",
  /** editorial-split ve product-frame: gerçek ürün ekranı. */
  image: {
    src: "/urun-ekrani.png",
    alt: `${SITE_NAME} ürün ekranı`,
    width: 1600,
    height: 1000,
  },
  /** live-data: sayılar ve hangi tarihe ait oldukları (ÖRNEK veri). */
  stats: {
    asOf: "2026-10-01",
    items: [
      { value: "2.418", label: "Aktif Ekip" },
      { value: "%38", label: "Daha Kısa Teslim Süresi" },
      { value: "4,7", label: "Ortalama Kullanıcı Puanı" },
    ],
  },
  /** bento: 3 ile 5 arası hücre; ilki büyük hücre olur. */
  bento: [
    {
      kind: "feature",
      title: "Tek Gelen Kutusu",
      body: "E-posta, form ve sohbetten gelen talepler aynı listeye düşer.",
      icon: Inbox,
    },
    { kind: "stat", value: "%38", label: "Daha Kısa Teslim Süresi" },
    { kind: "stat", value: "2.418", label: "Aktif Ekip" },
    {
      kind: "feature",
      title: "Haftalık Özet",
      body: "Biten, takılan ve yeni gelen işler pazartesi sabahı tek sayfada.",
      icon: CalendarCheck,
    },
  ],
  /** showcase: başlığın altındaki canlı pano. */
  board: {
    sample: true,
    title: "Destek Paneli",
    label: "Örnek pano: talep hunisi, bu hafta kapanan talepler ve bir talebin adımları.",
    range: "Son 7 Gün",
    funnel: {
      title: "Talep Hunisi",
      /** Başlıktaki oran: son aşama / ilk aşama, bileşende hesaplanır. */
      rateLabel: "Kapanma Oranı",
      stages: [
        { label: "Gelen", value: 1180 },
        { label: "Atanan", value: 964 },
        { label: "Yanıtlanan", value: 812 },
        { label: "Kapanan", value: 640 },
      ],
    },
    closed: {
      title: "Bu Hafta Kapanan",
      value: "640",
      delta: "+%12,4",
      weekly: [72, 96, 118, 104, 131, 61, 58],
      days: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    },
    thread: {
      title: "Talep #1042",
      pending: "Bekliyor",
      steps: [
        { label: "Talep Alındı", time: "09.12" },
        { label: "Muhasebeye Atandı", time: "09.12" },
        { label: "Yanıt Gönderildi", time: "09.47" },
      ],
    },
  },
  /** scroll-stage: kaydırdıkça sırayla gelen üç cümle. */
  stage: [
    "Talepler tek bir gelen kutusunda toplanır.",
    "Her işin bir sahibi ve bir tarihi olur.",
    "Haftanın sonunda neyin bittiği kendiliğinden görünür.",
  ],
} satisfies {
  variant: HeroVariant;
  scene: boolean;
  eyebrow: string;
  title: readonly HeroLine[];
  description: string;
  primary: Link;
  secondary: Link | null;
  meta: string;
  image: HeroImage | null;
  stats: { asOf: string; items: readonly HeroStat[] };
  bento: readonly HeroCell[];
  stage: readonly [string, string, string];
  board: HeroBoard;
};

/* ── Logo şeridi ───────────────────────────────────────────────────────── */

/** Uydurma müşteri adları: işaretleri `components/sections/Logos.tsx` adından üretir. */
export const logos = {
  title: "Bu Ekipler Her Gün Kullanıyor",
  names: ["Kuzey Lojistik", "Mavera", "Atlas Gıda", "Pervane", "Lodos Yazılım", "Demirhan", "Selvi Sağlık", "Karafil"],
  /** Şeridin altındaki durdurma denetimi (WCAG 2.2.2). */
  pause: "Şeridi Durdur",
} as const;

/* ── Özellikler (bento) ────────────────────────────────────────────────── */

/**
 * Her özellik kartının üstünde o özelliği OYNAYAN küçük canlı demo var
 * (guides/04-motion.md § 14): ikon karesi yok, ürün kendini gösteriyor.
 * Demo verisi ÖRNEKTİR; yalnızca ekranda ne olduğunu anlatır.
 */
export type InboxItem = { source: string; title: string; from: string };

export type FeatureDemo =
  | {
      kind: "inbox";
      /** Kaynak başına bekleyen talep (ÖRNEK); yeni talep düştükçe artar. */
      sourcesTitle: string;
      sources: readonly { name: string; count: number }[];
      items: readonly InboxItem[];
      /** Satırın yaşı konuma göre: en üstteki her zaman en yeni. */
      ages: readonly string[];
    }
  | { kind: "rules"; rules: readonly { match: string; owner: string; team: string }[] }
  | {
      kind: "digest";
      summary: readonly { label: string; value: string }[];
      days: readonly { label: string; value: number }[];
    }
  | { kind: "decisions"; task: string; status: string; noteTitle: string; notes: readonly { text: string; author: string; date: string }[] }
  | { kind: "access"; roles: readonly string[]; permissions: readonly { label: string; allowed: readonly boolean[] }[] };

export type Feature = { title: string; body: string; demo: FeatureDemo };

export const features = {
  title: "Bir İşin Başından Sonuna Kadar",
  description: "Talep geldiği andan teslim edildiği güne kadar her adım aynı yerde.",
  items: [
    {
      title: "Tek Gelen Kutusu",
      body: "E-posta, form ve sohbetten gelen talepler aynı listeye düşer; hiçbiri bir sekmede unutulmaz.",
      demo: {
        kind: "inbox",
        sourcesTitle: "Kaynaklar",
        sources: [
          { name: "E-posta", count: 128 },
          { name: "Web Formu", count: 64 },
          { name: "Sohbet", count: 41 },
          { name: "API", count: 19 },
        ],
        ages: ["Şimdi", "4 Dk", "11 Dk"],
        items: [
          { source: "E-posta", title: "Ekim faturasının kopyası", from: "Kuzey Lojistik" },
          { source: "Sohbet", title: "Teslim adresi değişikliği", from: "Atlas Gıda" },
          { source: "Web Formu", title: "Yeni kullanıcı daveti", from: "Pervane" },
          { source: "API", title: "Sipariş #8812 iptal edildi", from: "Mavera" },
          { source: "E-posta", title: "Sözleşme yenileme sorusu", from: "Selvi Sağlık" },
          { source: "Sohbet", title: "Rapor indirilemiyor", from: "Lodos Yazılım" },
        ],
      },
    },
    {
      title: "Sahiplik Kuralları",
      body: "Her talep yazdığın kurala göre doğru kişiye atanır.",
      demo: {
        kind: "rules",
        rules: [
          { match: "Fatura", owner: "Derya Aksoy", team: "Muhasebe" },
          { match: "İade", owner: "Kaan Yıldırım", team: "Destek" },
          { match: "Hata", owner: "Selin Ekinci", team: "Ürün" },
        ],
      },
    },
    {
      title: "Haftalık Özet",
      body: "Pazartesi sabahı biten, takılan ve yeni gelen işler tek sayfada.",
      demo: {
        kind: "digest",
        summary: [
          { label: "Biten", value: "42" },
          { label: "Takılan", value: "3" },
          { label: "Yeni", value: "57" },
        ],
        days: [
          { label: "Pzt", value: 9 },
          { label: "Sal", value: 12 },
          { label: "Çar", value: 7 },
          { label: "Per", value: 10 },
          { label: "Cum", value: 4 },
        ],
      },
    },
    {
      title: "Kararların Kaydı",
      body: "Bir kararın neden alındığı, işin hemen yanında yazılı kalır.",
      demo: {
        kind: "decisions",
        task: "Depo Taşıma Teslimi",
        status: "Ertelendi",
        noteTitle: "Karar Notu",
        notes: [
          { text: "Teslim 14 Kasım'a alındı, tedarikçi onayı bekleniyor.", author: "Selin Ekinci", date: "12 Kasım" },
          { text: "Ek maliyet bu çeyrekte değil, gelecek bütçede karşılanacak.", author: "Derya Aksoy", date: "13 Kasım" },
        ],
      },
    },
    {
      title: "Rol Tabanlı Erişim",
      body: "Kim neyi görür, kim neyi değiştirir; ekip büyüdükçe ayar tek yerde.",
      demo: {
        kind: "access",
        roles: ["Yönetici", "Üye", "Misafir"],
        permissions: [
          { label: "Talepleri Görür", allowed: [true, true, true] },
          { label: "Talep Atar", allowed: [true, true, false] },
          { label: "Kuralları Değiştirir", allowed: [true, false, false] },
        ],
      },
    },
  ],
} satisfies { title: string; description: string; items: readonly Feature[] };

/* ── Nasıl çalışır ─────────────────────────────────────────────────────── */

/**
 * Kaydırdıkça sağdaki ürün parçası adımın durumuna geçer (`HowItWorks`).
 * Sahne verisi ÖRNEKTİR.
 */
export const steps = {
  title: "Üç Adımda Hazır",
  description: "Kurulum bir öğleden sonra sürmez; ilk talep birkaç dakika içinde düşer.",
  /** Sahnenin üst satırı: ürün parçasının adı. */
  sceneTitle: "Destek Akışı",
  // Adımın adı fiilin kendisi: "Adım 1" gibi bir etiket bilgi taşımaz.
  items: [
    {
      title: "Bağla",
      body: "E-posta adresini ve formlarını iki tıklamayla bağla; geçmiş talepler de içeri aktarılır.",
      scene: {
        kind: "connect",
        badge: "Bağlı",
        rows: [
          { label: "E-posta", detail: "destek@example.com" },
          { label: "Web Formu", detail: "İletişim Sayfası" },
          { label: "Sohbet", detail: "Site Sohbeti" },
        ],
        note: "1.284 Geçmiş Talep İçeri Aktarıldı",
      },
    },
    {
      title: "Kuralları Yaz",
      body: "Hangi talebin kime gideceğini ve ne kadar sürede yanıtlanacağını bir kez belirle.",
      scene: {
        kind: "rules",
        rows: [
          { label: "Konu Fatura İçeriyorsa", detail: "Muhasebe · 4 Saat" },
          { label: "Kaynak Sohbetse", detail: "Destek · 30 Dakika" },
          { label: "Etiket Hata İse", detail: "Ürün · 1 Gün" },
        ],
        note: "Kurallar Yeni Gelen Her Talebe Uygulanır",
      },
    },
    {
      title: "Takip Et",
      body: "Takılan işler kendiliğinden öne çıkar; haftalık özet ekibin gelen kutusuna düşer.",
      scene: {
        kind: "track",
        rows: [
          { label: "İade Onayı", detail: "Takıldı · 2 Gün", tone: "danger" },
          { label: "Sözleşme Yenileme", detail: "Yanıt Bekliyor · 5 Saat", tone: "warning" },
          { label: "Ekim Faturası", detail: "Kapandı · Bugün", tone: "success" },
        ],
        note: "Haftalık Özet Pazartesi 09.00'da Gönderilir",
      },
    },
  ],
} as const satisfies {
  title: string;
  description: string;
  sceneTitle: string;
  items: readonly {
    title: string;
    body: string;
    scene: {
      kind: "connect" | "rules" | "track";
      /** connect: her bağlı kaynağın yanındaki durum. */
      badge?: string;
      rows: readonly { label: string; detail: string; tone?: "danger" | "warning" | "success" }[];
      note: string;
    };
  }[];
};

export type StepScene = (typeof steps.items)[number]["scene"];

/* ── Görüşler ──────────────────────────────────────────────────────────── */

export type Testimonial = { quote: string; name: string; role: string };

export const testimonials = {
  title: "Kullananlar Ne Diyor",
  /** Kişi seçicinin ekran okuyucu adı. */
  pick: "Görüş Seç",
  items: [
    {
      quote: "Üç ayrı araçtan bire indik. Pazartesi toplantısı artık kimin neyle uğraştığını sormakla geçmiyor.",
      name: "Derya Aksoy",
      role: "Operasyon Müdürü, Kuzey Lojistik",
    },
    {
      quote: "Kurallar bir kez yazıldı, talepler kendiliğinden dağılıyor.",
      name: "Kaan Yıldırım",
      role: "Destek Ekibi Lideri, Mavera",
    },
    {
      quote: "Bir kararın neden alındığını aramak zorunda kalmıyoruz, işin yanında duruyor.",
      name: "Selin Ekinci",
      role: "Ürün Yöneticisi, Pervane",
    },
  ],
} satisfies { title: string; pick: string; items: readonly Testimonial[] };

/* ── Fiyatlar ──────────────────────────────────────────────────────────── */

export type Billing = "monthly" | "yearly";

export type Plan = {
  name: string;
  /** Biçimlendirilmiş fiyat, döneme göre (ÖRNEK). Yıllıkta aylık karşılığı. */
  price: Record<Billing, string>;
  period: Record<Billing, string>;
  description: string;
  features: readonly string[];
  cta: Link;
  highlight?: string;
};

export const pricing = {
  title: "Ekibin Büyüdükçe Ölçeklenen Fiyat",
  description: "Küçük ekipler için ücretsiz; ihtiyaç arttıkça kişi başına öde.",
  /** Aylık / yıllık seçici. `saving` yıllık seçeneğin yanındaki kısa künye. */
  billing: { label: "Ödeme Dönemi", monthly: "Aylık", yearly: "Yıllık", saving: "%20 Daha Az" },
  sample: true,
  plans: [
    {
      name: "Başlangıç",
      price: { monthly: "₺0", yearly: "₺0" },
      period: { monthly: "Ay", yearly: "Ay" },
      description: "Beş kişiye kadar ekipler için.",
      features: ["Tek Gelen Kutusu", "Üç Sahiplik Kuralı", "Haftalık Özet"],
      cta: nav.cta,
    },
    {
      name: "Ekip",
      price: { monthly: "₺249", yearly: "₺199" },
      period: { monthly: "Kişi / Ay", yearly: "Kişi / Ay, Yıllık Ödeme" },
      description: "Birden fazla ekibin aynı akışta çalıştığı şirketler için.",
      features: [
        "Sınırsız Kural",
        "Kararların Kaydı",
        "Rol Tabanlı Erişim",
        "API Erişimi",
        "Öncelikli Destek",
      ],
      cta: { label: "Ekip Planına Geç", href: SIGNUP_HREF },
      highlight: "En Çok Seçilen",
    },
  ],
  enterprise: {
    name: "Kurumsal",
    description: "Tek oturum açma, özel sözleşme ve ayrılmış destek ekibi.",
    cta: { label: "Satışla Görüş", href: "mailto:satis@example.com" },
  },
} satisfies {
  title: string;
  description: string;
  billing: { label: string; monthly: string; yearly: string; saving: string };
  sample: boolean;
  plans: readonly Plan[];
  enterprise: { name: string; description: string; cta: Link };
};

/* ── SSS ───────────────────────────────────────────────────────────────── */

export const faq = {
  title: "Sık Sorulanlar",
  description: "Yanıtını bulamadığın soru için doğrudan yaz; bir iş günü içinde dönüyoruz.",
  contact: { label: "Soru Sor", href: "mailto:merhaba@example.com" },
  items: [
    {
      question: "Ücretsiz plan ne kadar süre geçerli?",
      answer: "Süre sınırı yok. Beş kişiyi aşana kadar ücretsiz planda kalabilirsin.",
    },
    {
      question: "Verilerimi dışarı aktarabilir miyim?",
      answer: "Evet. Bütün talepler ve kararlar CSV ve JSON olarak tek tıkla indirilir.",
    },
    {
      question: "Mevcut e-posta adresimizi kullanabilir miyiz?",
      answer: "Evet. Adresini yönlendirmen yeterli; gelen e-postalar talebe dönüşür, yanıtlar aynı adresten gider.",
    },
    {
      question: "Planı ay ortasında değiştirebilir miyim?",
      answer: "Değiştirebilirsin. Fark, kalan günlere bölünerek bir sonraki faturaya yansır.",
    },
  ],
} as const;

/* ── Kapanış ve alt bilgi ──────────────────────────────────────────────── */

export const finalCta = {
  title: "İlk Akışını Bugün Kur",
  description: "Kurulum beş dakika sürer, kredi kartı istenmez.",
  primary: nav.cta,
  secondary: { label: "Satışla Görüş", href: "mailto:satis@example.com" },
} as const;

export const footer = {
  tagline: SITE_DESCRIPTION,
  /** Düzenli sütunlar: başlık + bağlantılar. Sayfa içi çapalar ve gerçek adresler. */
  columns: [
    { title: "Ürün", links: nav.links },
    {
      title: "İletişim",
      links: [
        { label: "Satış", href: "mailto:satis@example.com" },
        { label: "Destek", href: "mailto:merhaba@example.com" },
      ],
    },
  ],
  legalTitle: "Yasal",
  links: [
    { label: "Gizlilik", href: "#" },
    { label: "Kullanım Koşulları", href: "#" },
    { label: "İletişim", href: "mailto:merhaba@example.com" },
  ],
} as const satisfies {
  tagline: string;
  columns: readonly { title: string; links: readonly Link[] }[];
  legalTitle: string;
  links: readonly Link[];
};

/** JSON-LD Organization için; boş bırakılan alan basılmaz. */
export const organization = {
  name: SITE_NAME,
  sameAs: [] as string[],
};
