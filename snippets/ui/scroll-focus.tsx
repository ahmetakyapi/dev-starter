import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kaydırma odağı: öğe ekranın altından yükselirken buğudan NETLEŞİR.
 * Saydamlık, bulanıklık, kayma ve hafif büyüklük kaydırma konumuna
 * bağlıdır; okur durursa geçiş de durur, geri kaydırırsa geri sararılır.
 * `Reveal` bir kez açılır ve biter; bu ise okurun eline bağlı bir
 * "odaklanma" hissidir. Sakin Akış turu (kişisel portfolyo dili); yalnız
 * davranış, kod alınmadı.
 *
 * NE ZAMAN: portfolyo akışında art arda gelen büyük medya kartları,
 * vaka sayfasında bölüm başlıkları (`variant="title"`), uzun tanıtımda
 * sahne geçişleri.
 * NE ZAMAN DEĞİL: kahraman / LCP öğesi (ilk boyamada soluk görünür),
 * form, tablo, okunması gereken gövde metni; aynı ekranda onlarca küçük
 * öğe (her biri ayrı katman, gereksiz iş). Tek seferlik giriş yeter ise
 * `reveal.tsx` ya da globals.css'teki `.scroll-reveal`.
 *
 * NASIL: SUNUCU bileşeni, JavaScript yok. CSS `animation-timeline: view()`
 * + `animation-range`: öğenin üst kenarı ekranın %98'inden %42'sine
 * çıkarken (media) saydamlık .34→1, bulanıklık 8px→0, kayma 18px→0,
 * ölçek 1.012→1; `title` için %92→%52 aralığında .2→1, 10px, 14px.
 * Eğri ease-out-cubic, ara kareler elle örneklendi (CSS `linear` zaman
 * çizelgesinde eğriyi kareler taşır). Aralık `entry` ile yazıldı: öğe
 * ekrana girdikçe ilerler ve uzun öğede bile tam görünür olmadan biter;
 * sayfanın dibindeki öğe yarı saydam takılı kalmaz.
 *
 * DESTEKSİZ TARAYICI: `@supports` dışında hiçbir stil uygulanmaz; içerik
 * düz ve tam görünür durur (gizli kalmaz). Hareketi azaltan kullanıcıda da
 * animasyon yok.
 *
 * ERİŞİLEBİLİRLİK: içerik DOM'da hep tam; yalnız görsel geçiş. Saydamlık
 * metnin okunurluğunu bir an düşürür; bu yüzden gövde metnine verme.
 *
 *   <ScrollFocus><ShotCard … /></ScrollFocus>
 *   <ScrollFocus variant="title" as="h2" className="text-title">Vaka</ScrollFocus>
 */

const CSS = `
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .ui-sf {
      animation: ui-sf-media linear both;
      animation-timeline: view();
      animation-range: entry 2% entry 100%;
      will-change: opacity, filter, transform;
    }
    .ui-sf[data-variant="title"] {
      animation-name: ui-sf-title;
      animation-range: entry 8% cover 48%;
    }
  }
}
@keyframes ui-sf-media {
  0% { opacity: .34; filter: blur(8px); transform: translateY(18px) scale(1.012); }
  25% { opacity: .78; filter: blur(3.4px); transform: translateY(7.6px) scale(1.005); }
  50% { opacity: .92; filter: blur(1px); transform: translateY(2.3px) scale(1.0015); }
  100% { opacity: 1; filter: blur(0); transform: none; }
}
@keyframes ui-sf-title {
  0% { opacity: .2; filter: blur(10px); transform: translateY(14px); }
  25% { opacity: .66; filter: blur(4.2px); transform: translateY(5.9px); }
  50% { opacity: .9; filter: blur(1.25px); transform: translateY(1.75px); }
  100% { opacity: 1; filter: blur(0); transform: none; }
}`;

type ScrollFocusProps = {
  children: ReactNode;
  /** `media`: büyük kart/görsel · `title`: bölüm başlığı (daha geç başlar, daha erken biter). */
  variant?: "media" | "title";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

export function ScrollFocus({ children, variant = "media", as: Tag = "div", className, style }: ScrollFocusProps) {
  return (
    <>
      <style href="ui-scroll-focus" precedence="default">
        {CSS}
      </style>
      <Tag data-variant={variant} className={cn("ui-sf", className)} style={style}>
        {children}
      </Tag>
    </>
  );
}
