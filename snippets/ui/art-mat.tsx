"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sergi paspartusu: ürün arayüzü (pencere, pano, kart) dokulu bir "tablo"
 * zemininin üstünde sergilenir. Zemin boyalı katmanlar, kareli kağıt ya da
 * sulu boya gökyüzüdür; kenarı isteğe bağlı yırtık kağıt gibi düzensiz.
 * Arayüz temiz ve keskin, zemin elle yapılmış ve sıcak: ikisinin zıtlığı
 * ürünü "ekran görüntüsü" olmaktan çıkarıp sergilenen bir nesneye çevirir.
 *
 * Referans turu 25 Kasım 2026: Synaps (kareli mavi kağıt, yırtık kenar,
 * pencere altta kırpılır), Lasso (boya katmanlı çöl, yırtık çerçeve), Grain
 * (buğday tarlası bandı kaydırınca karta daralır), Veridical ve Finance
 * (kaya ve krem zemin üstünde pano). Yalnız YAPI alındı: renk, görsel, metin
 * ve kod alınmadı; doku SVG filtresiyle token renklerinden üretilir.
 *
 * `variant`:
 *   - `strata`: yatay boya katmanları (çöl, tarla, ufuk). Fırça izi
 *     `feTurbulence` + `feDisplacementMap`. Kahraman ve özellik bölümü.
 *   - `grid`: kareli çizim kağıdı. Teknik, mimari, planlama ürünü.
 *   - `wash`: sulu boya gök ve bulut. Sakin, ferah; yapay zeka asistanı.
 * `tone`: `primary` paletin birincil ailesi; `earth` sıcak nötr (kehribar
 *   + metin rengi karışımı), her palette toprak tonunda kalır.
 * `edge="torn"`: zeminin kenarı yırtık kağıt; içerik kenardan içeride durur.
 * `crop`: içerik zeminin altından taşar ve kırpılır (pencerenin alt kenarı
 *   görünmez; "devamı var" duygusu, sayfa bölümsüz akar).
 * `scrollInset`: zemin görünüme girerken kenarlara taşan bir banttan
 *   (ölçek 1 + `bleed`) yerine oturan bir karta daralır (Grain). Yalnız
 *   `transform`; hareketi azaltan kullanıcıda durağan kart. Üst kabın
 *   `overflow-x: clip` olmalı (taşan bant yatay kaydırma açmasın).
 *
 * RENK: zemin token'lardan `color-mix` ile çizilir (hex yok); palet ve tema
 * değişince doku da döner. Bu bir ZEMİNDİR (`mesh-gradient` gibi): degrade
 * kuralının "üç yer"i içeriği kapsar, zemin içerik taşımaz. Sayfa başına
 * en çok iki paspartu; veri ekranının arkasına konmaz.
 *
 * ERİŞİLEBİLİRLİK: doku katmanı `aria-hidden`; içerik normal akışta,
 * erişilebilir. Filtre kimlikleri `useId` (aynı sayfada birden çok paspartu).
 *
 *   <ArtMat variant="strata" edge="torn" crop>
 *     <AppWindow title="Pano">…</AppWindow>
 *   </ArtMat>
 */

export type ArtMatVariant = "strata" | "grid" | "wash";
export type ArtMatTone = "primary" | "earth";

export interface ArtMatProps {
  children?: ReactNode;
  variant?: ArtMatVariant;
  tone?: ArtMatTone;
  edge?: "torn" | "clean";
  /** İçerik altta kırpılır: zeminin alt iç boşluğu yok, taşan kısım gizli. */
  crop?: boolean;
  /** İç boşluk: içeriğin zemin kenarına uzaklığı. */
  pad?: "sm" | "md" | "lg";
  /** Görünüme girerken bant → kart daralması. */
  scrollInset?: boolean;
  /** `scrollInset` başlangıç taşması (0.04 = her yandan ~%2). */
  bleed?: number;
  className?: string;
  /** İçerik sarmalayıcısına ek sınıf (hizalama, en çok genişlik). */
  contentClassName?: string;
  style?: CSSProperties;
}

const mix = (a: string, pct: number, b = "var(--page-bg)") => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

/** Ton başına boya ailesi: açıktan koyuya beş durak. Hepsi token. */
function palette(tone: ArtMatTone) {
  if (tone === "earth") {
    return [
      mix("var(--accent-warm)", 18),
      mix("var(--accent-warm)", 42),
      mix("var(--accent-warm)", 62, "var(--text-strong)"),
      mix("var(--accent-warm)", 30, "var(--text-strong)"),
      mix("var(--text-strong)", 72, "var(--accent-warm)"),
    ];
  }
  return [
    mix("var(--primary-soft)", 22),
    mix("var(--primary-soft)", 48),
    mix("var(--primary)", 72),
    mix("var(--primary-hover)", 82, "var(--text-strong)"),
    mix("var(--accent-warm)", 46),
  ];
}

const PAD = { sm: "p-3 sm:p-5", md: "p-4 sm:p-8 lg:p-10", lg: "p-5 sm:p-12 lg:p-16" } as const;
const PAD_CROP = { sm: "px-3 pt-3 sm:px-5 sm:pt-5", md: "px-4 pt-4 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10", lg: "px-5 pt-5 sm:px-12 sm:pt-12 lg:px-16 lg:pt-16" } as const;

function Texture({ variant, tone, torn, uid }: { variant: ArtMatVariant; tone: ArtMatTone; torn: boolean; uid: string }) {
  const c = palette(tone);
  const id = (s: string) => `${uid}-${s}`;
  // Yırtık kenar: dikdörtgen kenardan biraz içeride, filtre kenarı dalgalandırır.
  const inset = torn ? { x: "1.2%", y: "1.6%", width: "97.6%", height: "96.8%" } : { x: "0", y: "0", width: "100%", height: "100%" };
  return (
    // Koyu temada doku bir tık geri çekilir: zemin sayfanın koyusunu biraz gösterir, ürün öne çıkar.
    <svg aria-hidden focusable="false" className="pointer-events-none absolute inset-0 -z-10 size-full [:root[data-theme=dark]_&]:opacity-75" preserveAspectRatio="none">
      <defs>
        {/* Fırça: yatayda uzun, dikeyde sık gürültü → yatay boya izi. */}
        <filter id={id("paint")} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={variant === "wash" ? "0.006 0.012" : "0.004 0.09"} numOctaves={4} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={variant === "wash" ? 60 : 38} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Kağıt lifi: ince grenli doku, çarpımla. */}
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.22" />
          </feComponentTransfer>
        </filter>
        {/* Bulut: düşük frekanslı gürültü, eşikle yumuşak lekeler. */}
        <filter id={id("cloud")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves={5} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.5" />
        </filter>
        {/* Yırtık kenar: kısa dalga boylu yer değiştirme yalnız maskeye. */}
        <filter id={id("torn")} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={3} seed={5} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id={id("edge")} maskContentUnits="userSpaceOnUse">
          <rect {...inset} fill="white" filter={torn ? `url(#${id("torn")})` : undefined} />
        </mask>
        <linearGradient id={id("strata")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: c[0] }} />
          <stop offset="0.3" style={{ stopColor: c[1] }} />
          <stop offset="0.46" style={{ stopColor: c[4] }} />
          <stop offset="0.6" style={{ stopColor: c[2] }} />
          <stop offset="0.74" style={{ stopColor: c[1] }} />
          <stop offset="0.86" style={{ stopColor: c[3] }} />
          <stop offset="1" style={{ stopColor: c[2] }} />
        </linearGradient>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: c[2] }} />
          <stop offset="0.55" style={{ stopColor: c[1] }} />
          <stop offset="1" style={{ stopColor: c[0] }} />
        </linearGradient>
        <pattern id={id("grid")} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" style={{ stroke: mix("var(--text-strong)", 14, "transparent") }} strokeWidth="1" />
        </pattern>
      </defs>
      <g mask={`url(#${id("edge")})`}>
        {variant === "strata" ? (
          <>
            <rect width="100%" height="100%" style={{ fill: c[1] }} />
            <rect x="-4%" y="-4%" width="108%" height="108%" fill={`url(#${id("strata")})`} filter={`url(#${id("paint")})`} />
          </>
        ) : null}
        {variant === "grid" ? (
          <>
            <rect width="100%" height="100%" style={{ fill: c[1] }} />
            <rect width="100%" height="100%" fill={`url(#${id("grid")})`} />
            {/* Köşede ikinci, koyu bir kağıt parçası: kolaj hissi. */}
            <svg width="38%" height="42%" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">
              <path d="M0 0H100L86 18 94 36 74 54 64 74 40 82 0 96Z" style={{ fill: c[3], opacity: 0.85 }} filter={`url(#${id("torn")})`} />
            </svg>
          </>
        ) : null}
        {variant === "wash" ? (
          <>
            <rect width="100%" height="100%" fill={`url(#${id("sky")})`} />
            <rect width="100%" height="100%" filter={`url(#${id("cloud")})`} opacity="0.75" />
          </>
        ) : null}
        <rect width="100%" height="100%" filter={`url(#${id("grain")})`} style={{ mixBlendMode: "multiply" }} />
      </g>
    </svg>
  );
}

export function ArtMat({
  children,
  variant = "strata",
  tone = "primary",
  edge = "clean",
  crop = false,
  pad = "md",
  scrollInset = false,
  bleed = 0.06,
  className,
  contentClassName,
  style,
}: ArtMatProps) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1 + bleed, 1]);
  const live = scrollInset && !reduce;
  const torn = edge === "torn";
  return (
    <m.div
      ref={ref}
      style={{ ...style, ...(live ? { scale } : null) }}
      className={cn(
        "relative isolate overflow-hidden",
        // Yırtık kenarda köşe yuvarlanmaz: kağıt yırtılır, kesilmez.
        torn ? "rounded-none" : "rounded-xl sm:rounded-[1.75rem]",
        crop ? PAD_CROP[pad] : PAD[pad],
        className,
      )}
    >
      <Texture variant={variant} tone={tone} torn={torn} uid={uid} />
      <div className={cn("relative mx-auto w-full", crop && "-mb-px", contentClassName)}>{children}</div>
    </m.div>
  );
}
