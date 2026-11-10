// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useId, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Sıvı cam: arkasındaki görüntüyü hafifçe büken, kenarı ışık kıran cam hap.
 * Fotoğraflı ya da çizimli kahramanın üstündeki TEK birincil eylem (Ribbon'ın
 * gökyüzü kahramanındaki "İndir" düğmesi) ve görsel zeminli kapanış çağrısı.
 * Düz zeminde (`bg-page`) kullanma: bükülecek bir şey yoksa sadece bulanık,
 * gri bir hap kalır; orada `bg-cta` doğru düğmedir.
 *
 * KATMANLAR (hepsi `aria-hidden`, içerik en üstte):
 *   1. kenar: çok katmanlı iç gölge. Sol üst ve sağ alt köşede ince, koyu
 *      kırılma çizgisi; içte yumuşak hale. Renkler token'dan (`--glass-edge`,
 *      `--glass-glow`), tema dönünce cam da döner.
 *   2. buğu: `backdrop-filter: blur + saturate`; her tarayıcıda çalışır.
 *   3. bükülme: `backdrop-filter: url(#filtre)`, SVG `feTurbulence` gürültüsü
 *      `feDisplacementMap` ile arka planı kaydırır. YALNIZ Chromium destekler;
 *      Safari ve Firefox bu bildirimi geçersiz sayıp atlar, 2. katman kalır.
 *      Yani hiçbir tarayıcıda kırılmaz, yalnız sadeleşir.
 *
 * TON: `auto` kenarı metin rengiyle çizer (açık temada koyu, koyu temada
 * açık). `media` fotoğraf üstü içindir: kenar her temada koyu, metin beyaz
 * (`text-on-brand`); metnin okunurluğu zeminin kendisine bağlı, kahraman
 * görselinin bu bölgesi yeterince koyu ya da doygun olmalı (kontrastı ölç).
 *
 * Filtre her örnekte `useId` ile tekil kimlik taşır (aynı kimlikle iki SVG
 * filtresi geçersiz HTML). Dosya sunucu bileşeni; `useId` sunucuda da çalışır.
 *
 *   <LiquidGlassLink href="/indir" tone="media" className="h-12 px-7">
 *     <Download aria-hidden className="size-4" /> Mac İçin İndir
 *   </LiquidGlassLink>
 */

const CSS = `
.ui-glass { position: relative; isolation: isolate; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  --glass-edge: var(--text-strong); --glass-glow: var(--page); }
.ui-glass[data-tone="media"] { --glass-edge: var(--scrim); --glass-glow: var(--on-brand); }
.ui-glass > .ui-glass-rim, .ui-glass > .ui-glass-fog, .ui-glass > .ui-glass-bend {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }
.ui-glass > .ui-glass-rim { z-index: 1; box-shadow:
  0 2px 6px color-mix(in oklab, var(--glass-edge) 10%, transparent),
  inset 3px 3px 0.5px -3px color-mix(in oklab, var(--glass-edge) 85%, transparent),
  inset -3px -3px 0.5px -3px color-mix(in oklab, var(--glass-edge) 80%, transparent),
  inset 1px 1px 1px -0.5px color-mix(in oklab, var(--glass-edge) 55%, transparent),
  inset -1px -1px 1px -0.5px color-mix(in oklab, var(--glass-edge) 55%, transparent),
  inset 0 0 6px 6px color-mix(in oklab, var(--glass-edge) 10%, transparent),
  0 0 12px color-mix(in oklab, var(--glass-glow) 18%, transparent); }
.ui-glass > .ui-glass-fog { z-index: -2; -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.5); backdrop-filter: blur(var(--glass-blur)) saturate(1.5); }
.ui-glass > .ui-glass-bend { z-index: -1; overflow: hidden; }
.ui-glass > .ui-glass-content { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: inherit; }
a.ui-glass, button.ui-glass { transition: transform 0.3s var(--ease-brand); }
a.ui-glass:hover, button.ui-glass:hover { transform: scale(1.04); }
a.ui-glass:active, button.ui-glass:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { a.ui-glass, button.ui-glass { transition: none; } a.ui-glass:hover, button.ui-glass:hover, a.ui-glass:active, button.ui-glass:active { transform: none; } }
@media (prefers-reduced-transparency: reduce) { .ui-glass > .ui-glass-fog, .ui-glass > .ui-glass-bend { backdrop-filter: none; -webkit-backdrop-filter: none; background: color-mix(in oklab, var(--glass-edge) 55%, transparent); } }`;

type GlassOwnProps = {
  /** `auto`: kenar metin rengiyle döner. `media`: fotoğraf üstü, koyu kenar ve beyaz metin. */
  tone?: "auto" | "media";
  /** Bükülme gücü (piksel kayması). 40 sakin, 70 Ribbon'daki kadar belirgin, 100 üstü dalgalı. */
  strength?: number;
  /** Buğu yarıçapı, piksel. */
  blur?: number;
};

function GlassLayers({ strength, children }: { strength: number; children: ReactNode }) {
  const id = `ui-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <style href="ui-liquid-glass" precedence="default">
        {CSS}
      </style>
      <span aria-hidden className="ui-glass-rim" />
      <span aria-hidden className="ui-glass-fog" />
      <span aria-hidden className="ui-glass-bend" style={{ backdropFilter: `url("#${id}")` }} />
      <svg aria-hidden className="pointer-events-none absolute size-0 overflow-hidden">
        <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves={1} seed={1} result="noise" />
          <feGaussianBlur in="noise" stdDeviation={2} result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale={strength} xChannelSelector="R" yChannelSelector="B" result="bent" />
          <feGaussianBlur in="bent" stdDeviation={3} />
        </filter>
      </svg>
      <span className="ui-glass-content">{children}</span>
    </>
  );
}

const base = (tone: GlassOwnProps["tone"]) =>
  cn("ui-glass rounded-full font-medium", tone === "media" ? "text-on-brand" : "text-strong");

/** Etkileşimsiz cam yüzey: rozet, fiyat etiketi, görsel üstü künye. */
export function LiquidGlass({
  tone = "auto",
  strength = 60,
  blur = 3,
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & GlassOwnProps) {
  return (
    <span
      data-tone={tone}
      className={cn(base(tone), "px-4 py-2 text-small", className)}
      style={{ ["--glass-blur" as string]: `${blur}px`, ...style }}
      {...props}
    >
      <GlassLayers strength={strength}>{children}</GlassLayers>
    </span>
  );
}

/** Cam bağlantı: kahramanın indirme ya da kayıt eylemi. Dosya indirme ve dış adres için. İç rotada istemci geçişi isteniyorsa `next/link` kullan ve içine `LiquidGlass` koy. */
export function LiquidGlassLink({
  tone = "auto",
  strength = 60,
  blur = 3,
  className,
  style,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & GlassOwnProps) {
  return (
    <a
      data-tone={tone}
      className={cn(base(tone), "min-h-11 px-6 text-base tracking-tight [&_svg]:shrink-0", className)}
      style={{ ["--glass-blur" as string]: `${blur}px`, ...style }}
      {...props}
    >
      <GlassLayers strength={strength}>{children}</GlassLayers>
    </a>
  );
}

/** Cam düğme. `type` varsayılanı `button` (formu yanlışlıkla göndermesin). */
export function LiquidGlassButton({
  tone = "auto",
  strength = 60,
  blur = 3,
  className,
  style,
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & GlassOwnProps) {
  return (
    <button
      type={type}
      data-tone={tone}
      className={cn(base(tone), "min-h-11 px-6 text-base tracking-tight disabled:opacity-50 [&_svg]:shrink-0", className)}
      style={{ ["--glass-blur" as string]: `${blur}px`, ...style }}
      {...props}
    >
      <GlassLayers strength={strength}>{children}</GlassLayers>
    </button>
  );
}
