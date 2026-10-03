import {
  CalendarCheck,
  Inbox,
  NotebookPen,
  Route,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
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
 * SAYILAR ÖRNEKTİR. Hero ve bento rakamları demo içindir; gerçek veri yoksa
 * yayına çıkmadan kaldır. Uydurma kesinlik, sayfanın en hızlı kaybettiği güven.
 */

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
 * Yedi hero düzeni (`components/heroes/`). Seçim tek satır: `hero.variant`.
 * Hangisinin ne zaman kullanılacağı `components/heroes/index.tsx` başında.
 */
export const HERO_VARIANTS = [
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

export const hero = {
  variant: "live-data" as HeroVariant,
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
};

/* ── Logo şeridi ───────────────────────────────────────────────────────── */

/** Uydurma müşteri adları: işaretleri `components/sections/Logos.tsx` adından üretir. */
export const logos = {
  title: "Bu Ekipler Her Gün Kullanıyor",
  names: ["Kuzey Lojistik", "Mavera", "Atlas Gıda", "Pervane", "Lodos Yazılım", "Demirhan", "Selvi Sağlık", "Karafil"],
} as const;

/* ── Özellikler (bento) ────────────────────────────────────────────────── */

export type Feature = { title: string; body: string; icon: LucideIcon; tags?: readonly string[] };

export const features = {
  title: "Bir İşin Başından Sonuna Kadar",
  description: "Talep geldiği andan teslim edildiği güne kadar her adım aynı yerde.",
  items: [
    {
      title: "Tek Gelen Kutusu",
      body: "E-posta, form ve sohbetten gelen talepler aynı listeye düşer; hiçbiri bir sekmede unutulmaz.",
      icon: Inbox,
      tags: ["E-posta", "Web Formu", "Sohbet", "API"],
    },
    {
      title: "Sahiplik Kuralları",
      body: "Her talep yazdığın kurala göre doğru kişiye atanır.",
      icon: Route,
    },
    {
      title: "Haftalık Özet",
      body: "Pazartesi sabahı biten, takılan ve yeni gelen işler tek sayfada.",
      icon: CalendarCheck,
    },
    {
      title: "Kararların Kaydı",
      body: "Bir kararın neden alındığı, işin hemen yanında yazılı kalır.",
      icon: NotebookPen,
    },
    {
      title: "Rol Tabanlı Erişim",
      body: "Kim neyi görür, kim neyi değiştirir; ekip büyüdükçe ayar tek yerde.",
      icon: ShieldCheck,
    },
  ],
} satisfies { title: string; description: string; items: readonly Feature[] };

/* ── Nasıl çalışır ─────────────────────────────────────────────────────── */

export const steps = {
  title: "Üç Adımda Hazır",
  description: "Kurulum bir öğleden sonra sürmez; ilk talep birkaç dakika içinde düşer.",
  // Adımın adı fiilin kendisi: "Adım 1" gibi bir etiket bilgi taşımaz.
  items: [
    { title: "Bağla", body: "E-posta adresini ve formlarını iki tıklamayla bağla; geçmiş talepler de içeri aktarılır." },
    { title: "Kuralları Yaz", body: "Hangi talebin kime gideceğini ve ne kadar sürede yanıtlanacağını bir kez belirle." },
    { title: "Takip Et", body: "Takılan işler kendiliğinden öne çıkar; haftalık özet ekibin gelen kutusuna düşer." },
  ],
} as const;

/* ── Görüşler ──────────────────────────────────────────────────────────── */

export type Testimonial = { quote: string; name: string; role: string };

export const testimonials = {
  title: "Kullananlar Ne Diyor",
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
} satisfies { title: string; items: readonly Testimonial[] };

/* ── Fiyatlar ──────────────────────────────────────────────────────────── */

export type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: Link;
  highlight?: string;
};

export const pricing = {
  title: "Ekibin Büyüdükçe Ölçeklenen Fiyat",
  description: "Küçük ekipler için ücretsiz; ihtiyaç arttıkça kişi başına öde.",
  plans: [
    {
      name: "Başlangıç",
      price: "₺0",
      period: "Ay",
      description: "Beş kişiye kadar ekipler için.",
      features: ["Tek Gelen Kutusu", "Üç Sahiplik Kuralı", "Haftalık Özet"],
      cta: nav.cta,
    },
    {
      name: "Ekip",
      price: "₺249",
      period: "Kişi / Ay",
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
  plans: readonly Plan[];
  enterprise: { name: string; description: string; cta: Link };
};

/* ── SSS ───────────────────────────────────────────────────────────────── */

export const faq = {
  title: "Sık Sorulanlar",
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
} as const;

export const footer = {
  tagline: SITE_DESCRIPTION,
  links: [
    { label: "Gizlilik", href: "#" },
    { label: "Kullanım Koşulları", href: "#" },
    { label: "İletişim", href: "mailto:merhaba@example.com" },
  ],
} as const satisfies { tagline: string; links: readonly Link[] };

/** JSON-LD Organization için; boş bırakılan alan basılmaz. */
export const organization = {
  name: SITE_NAME,
  sameAs: [] as string[],
};
