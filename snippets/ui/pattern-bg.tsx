import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Desen zemin: bölümün arkasına token renginde ızgara, nokta, çizgi, doku ya
 * da ışık. Kahraman zemini, boş durum, tanıtım bölümü, kart arkası. İçerik
 * değil atmosfer: çizgiler `--line-strong`ın saydamı, ışık paletin birincil
 * rengi. Tema ve paletle kendiliğinden döner; tek bir hex yok.
 *
 * ÜÇ KATMAN, BİRBİRİNDEN BAĞIMSIZ:
 *   - `pattern`: tekrar eden desen (ızgara, nokta, çapraz, halka, gürültü…)
 *   - `fade`: desenin nerede sönüp kaybolacağı (maske; renk değil alfa)
 *   - `glow`: desenin altında, solmadan etkilenmeyen ışık (`horizon-top`…)
 * Hazır birleşimler `PATTERN_PRESETS`te (Storybook → Desen Kütüphanesi;
 * kartta "Kopyala" tam JSX'i verir).
 *
 * DEGRADE DİSİPLİNİ: ışık tek renk ailesi (birincil → saydam), yalnız
 * bölüm zemininde ve metnin ARKASINDA kalır; üstündeki metnin kontrastı
 * ışığın en yoğun yerinde ölçülür (`intensity` ile kısılır). Veri
 * panelinin arkasına desen koyma: okumayı böler.
 *
 * Kap `relative isolate` olmalı; katman `absolute inset-0 -z-10`,
 * `aria-hidden`, `pointer-events: none`. Stil `@layer components`te:
 * `className="fixed"` (bütün sayfa zemini) gibi yardımcı sınıflar onu
 * ezebilir. Hareket yok. Sunucu bileşeni.
 *
 *   <section className="relative isolate">
 *     <PatternBackground pattern="grid" fade="top" glow="glow-top" />
 *     …
 *   </section>
 */

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.2 -1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const PAPER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.035 .6' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.6 -0.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")";

const CSS = `
@layer components {
.ui-pat, .ui-pat > *, .ui-pat-layer { position: absolute; inset: 0; pointer-events: none; }
.ui-pat { z-index: -10; overflow: hidden; }
.ui-pat-fade { -webkit-mask-image: var(--pat-fade); mask-image: var(--pat-fade); }
.ui-pat-layer { background-size: var(--pat-s) var(--pat-s); }
.ui-pat-layer[data-p="grid"] { background-image: linear-gradient(to right, var(--pat-ink) 1px, transparent 1px), linear-gradient(to bottom, var(--pat-ink) 1px, transparent 1px); }
.ui-pat-layer[data-p="grid-dashed"] { background-image: linear-gradient(to right, var(--pat-ink) 1px, transparent 1px), linear-gradient(to bottom, var(--pat-ink) 1px, transparent 1px);
  -webkit-mask-image: repeating-linear-gradient(to right, black 0 4px, transparent 4px 8px), repeating-linear-gradient(to bottom, black 0 4px, transparent 4px 8px);
  -webkit-mask-composite: source-in; mask-image: repeating-linear-gradient(to right, black 0 4px, transparent 4px 8px), repeating-linear-gradient(to bottom, black 0 4px, transparent 4px 8px); mask-composite: intersect; }
.ui-pat-layer[data-p="dots"] { background-image: radial-gradient(circle at center, var(--pat-ink) 1.1px, transparent 1.6px); }
.ui-pat-layer[data-p="dot-grid"] { background-image: radial-gradient(circle at 0 0, var(--pat-ink) 1.6px, transparent 2.2px), linear-gradient(to right, var(--pat-ink-soft) 1px, transparent 1px), linear-gradient(to bottom, var(--pat-ink-soft) 1px, transparent 1px); }
.ui-pat-layer[data-p="diagonal"] { background-size: auto; background-image: repeating-linear-gradient(45deg, var(--pat-ink) 0 1px, transparent 1px var(--pat-s)); }
.ui-pat-layer[data-p="crosshatch"] { background-size: auto; background-image: repeating-linear-gradient(45deg, var(--pat-ink) 0 1px, transparent 1px var(--pat-s)), repeating-linear-gradient(-45deg, var(--pat-ink) 0 1px, transparent 1px var(--pat-s)); }
.ui-pat-layer[data-p="diagonal-grid"] { background-image: linear-gradient(45deg, transparent calc(50% - 0.5px), var(--pat-ink) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(-45deg, transparent calc(50% - 0.5px), var(--pat-ink) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(to right, var(--pat-ink-soft) 1px, transparent 1px), linear-gradient(to bottom, var(--pat-ink-soft) 1px, transparent 1px); }
.ui-pat-layer[data-p="vertical"] { background-size: var(--pat-s) 100%; background-image: linear-gradient(to right, var(--pat-ink) 1px, transparent 1px); }
.ui-pat-layer[data-p="horizontal"] { background-size: auto var(--pat-s); background-image: linear-gradient(to bottom, var(--pat-ink) 1px, transparent 1px); }
.ui-pat-layer[data-p="rings"] { background-size: auto; background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 calc(var(--pat-s) - 1px), var(--pat-ink) calc(var(--pat-s) - 1px) var(--pat-s)); }
.ui-pat-layer[data-p="checker"] { background-image: conic-gradient(var(--pat-fill) 25%, transparent 0 50%, var(--pat-fill) 0 75%, transparent 0); }
.ui-pat-layer[data-p="zigzag"] { background-image: linear-gradient(135deg, var(--pat-fill) 25%, transparent 25%), linear-gradient(225deg, var(--pat-fill) 25%, transparent 25%), linear-gradient(315deg, var(--pat-fill) 25%, transparent 25%), linear-gradient(45deg, var(--pat-fill) 25%, transparent 25%); background-position: calc(var(--pat-s) / -2) 0, calc(var(--pat-s) / -2) 0, 0 0, 0 0; }
.ui-pat-layer[data-p="noise"], .ui-pat-layer[data-p="paper"] { background: var(--pat-grain); opacity: 0.16; -webkit-mask-size: auto; mask-size: auto; }
.ui-pat-layer[data-p="paper"] { opacity: 0.1; }
.ui-pat-layer[data-p="noise"] { -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
.ui-pat-layer[data-p="paper"] { -webkit-mask-image: ${PAPER}; mask-image: ${PAPER}; }
.ui-pat-glow[data-g="horizon-top"] { background: radial-gradient(125% 125% at 50% 10%, transparent 40%, var(--pat-glow) 100%); }
.ui-pat-glow[data-g="horizon-bottom"] { background: radial-gradient(125% 125% at 50% 90%, transparent 40%, var(--pat-glow) 100%); }
.ui-pat-glow[data-g="glow-top"] { background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--pat-glow), transparent 70%); }
.ui-pat-glow[data-g="glow-bottom"] { background: radial-gradient(ellipse 80% 60% at 50% 100%, var(--pat-glow), transparent 70%); }
.ui-pat-glow[data-g="spotlight"] { background: radial-gradient(ellipse 38% 70% at 50% -8%, var(--pat-glow), transparent 72%); }
.ui-pat-glow[data-g="bloom"] { background: radial-gradient(circle at 50% 50%, var(--pat-glow), transparent 58%); }
.ui-pat-glow[data-g="corner"] { background: radial-gradient(circle at 100% 0%, var(--pat-glow), transparent 55%); }
.ui-pat-glow[data-g="dual-corner"] { background: radial-gradient(circle at 0% 0%, var(--pat-glow), transparent 45%), radial-gradient(circle at 100% 100%, var(--pat-glow), transparent 45%); }
.ui-pat-glow[data-g="side-left"] { background: radial-gradient(ellipse 60% 90% at 0% 50%, var(--pat-glow), transparent 70%); }
.ui-pat-glow[data-g="side-right"] { background: radial-gradient(ellipse 60% 90% at 100% 50%, var(--pat-glow), transparent 70%); }
}`;

const FADES = {
  none: "none",
  top: "linear-gradient(to bottom, black, transparent 72%)",
  bottom: "linear-gradient(to top, black, transparent 72%)",
  left: "linear-gradient(to right, black, transparent 65%)",
  right: "linear-gradient(to left, black, transparent 65%)",
  center: "radial-gradient(ellipse 65% 60% at 50% 50%, black 25%, transparent 75%)",
  edges: "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 35%, black 100%)",
  "diagonal-tl": "linear-gradient(135deg, black, transparent 62%)",
  "diagonal-br": "linear-gradient(315deg, black, transparent 62%)",
} as const;

export type Pattern =
  | "none"
  | "grid"
  | "grid-dashed"
  | "dots"
  | "dot-grid"
  | "diagonal"
  | "crosshatch"
  | "diagonal-grid"
  | "vertical"
  | "horizontal"
  | "rings"
  | "checker"
  | "zigzag"
  | "noise"
  | "paper";
export type PatternFade = keyof typeof FADES;
export type PatternGlow =
  | "none"
  | "horizon-top"
  | "horizon-bottom"
  | "glow-top"
  | "glow-bottom"
  | "spotlight"
  | "bloom"
  | "corner"
  | "dual-corner"
  | "side-left"
  | "side-right";

export type PatternBackgroundProps = {
  pattern?: Pattern;
  fade?: PatternFade;
  glow?: PatternGlow;
  /** Desen çizgisinin rengi: nötr çizgi ya da birincil ailenin saydamı. */
  tone?: "neutral" | "primary";
  /** Bir karonun pikseli (ızgara aralığı, nokta aralığı). */
  size?: number;
  /** Işığın gücü, 0-1. Üstünde metin varsa 0,5'i geçme. */
  intensity?: number;
  className?: string;
};

export function PatternBackground({
  pattern = "grid",
  fade = "none",
  glow = "none",
  tone = "neutral",
  size = 24,
  intensity = 0.45,
  className,
}: PatternBackgroundProps) {
  const ink = tone === "primary" ? "color-mix(in oklab, var(--primary) 32%, transparent)" : "color-mix(in oklab, var(--line-strong) 75%, transparent)";
  const level = Math.round(Math.min(1, Math.max(0, intensity)) * 100);
  return (
    <>
      <style href="ui-pattern-bg" precedence="default">
        {CSS}
      </style>
      <div
        aria-hidden
        className={cn("ui-pat", className)}
        style={
          {
            "--pat-s": `${size}px`,
            "--pat-ink": ink,
            "--pat-ink-soft": `color-mix(in oklab, ${ink} 45%, transparent)`,
            "--pat-fill": `color-mix(in oklab, ${ink} 40%, transparent)`,
            "--pat-grain": tone === "primary" ? "var(--primary)" : "var(--text-strong)",
            "--pat-glow": `color-mix(in oklab, var(--primary) ${level}%, transparent)`,
            "--pat-fade": FADES[fade],
          } as CSSProperties
        }
      >
        {glow !== "none" ? <div className="ui-pat-glow" data-g={glow} /> : null}
        {pattern !== "none" ? (
          <div className={cn(fade !== "none" && "ui-pat-fade")}>
            <div className="ui-pat-layer" data-p={pattern} />
          </div>
        ) : null}
      </div>
    </>
  );
}

/** Hazır birleşimler: ad, kategori, prop'lar. Storybook kütüphanesi ve "Kopyala" bunlardan. */
export const PATTERN_CATEGORIES = ["Işık", "Izgara", "Nokta", "Çizgi", "Geometri", "Doku"] as const;
export type PatternCategory = (typeof PATTERN_CATEGORIES)[number];

export const PATTERN_PRESETS: readonly { id: string; title: string; category: PatternCategory; props: PatternBackgroundProps }[] = [
  { id: "ufuk-ust", title: "Ufuk Işığı · Üst", category: "Işık", props: { pattern: "none", glow: "horizon-top", intensity: 0.55 } },
  { id: "ufuk-alt", title: "Ufuk Işığı · Alt", category: "Işık", props: { pattern: "none", glow: "horizon-bottom", intensity: 0.55 } },
  { id: "tepe-isigi", title: "Tepe Işığı", category: "Işık", props: { pattern: "none", glow: "glow-top" } },
  { id: "taban-isigi", title: "Taban Işığı", category: "Işık", props: { pattern: "none", glow: "glow-bottom" } },
  { id: "spot", title: "Spot", category: "Işık", props: { pattern: "none", glow: "spotlight", intensity: 0.6 } },
  { id: "merkez", title: "Merkez Işıması", category: "Işık", props: { pattern: "none", glow: "bloom", intensity: 0.35 } },
  { id: "kose", title: "Köşe Işığı", category: "Işık", props: { pattern: "none", glow: "corner" } },
  { id: "cift-kose", title: "Çift Köşe", category: "Işık", props: { pattern: "none", glow: "dual-corner", intensity: 0.4 } },
  { id: "yan-sol", title: "Yan Işık · Sol", category: "Işık", props: { pattern: "none", glow: "side-left" } },
  { id: "izgara", title: "Izgara", category: "Izgara", props: { pattern: "grid" } },
  { id: "izgara-ust", title: "Üstten Solan Izgara", category: "Izgara", props: { pattern: "grid", fade: "top" } },
  { id: "izgara-alt", title: "Alttan Solan Izgara", category: "Izgara", props: { pattern: "grid", fade: "bottom" } },
  { id: "izgara-merkez", title: "Merkezde Izgara", category: "Izgara", props: { pattern: "grid", fade: "center" } },
  { id: "izgara-capraz", title: "Çapraz Solan Izgara", category: "Izgara", props: { pattern: "grid", fade: "diagonal-tl" } },
  { id: "izgara-isik", title: "Işıklı Izgara", category: "Izgara", props: { pattern: "grid", fade: "top", glow: "glow-top", tone: "primary" } },
  { id: "izgara-sol", title: "Soldan Maskeli Izgara", category: "Izgara", props: { pattern: "grid", fade: "left", size: 32 } },
  { id: "kesik-izgara", title: "Kesik Izgara", category: "Izgara", props: { pattern: "grid-dashed", fade: "center", size: 32 } },
  { id: "kesik-ust", title: "Üstten Solan Kesik Izgara", category: "Izgara", props: { pattern: "grid-dashed", fade: "top", size: 32 } },
  { id: "capraz-izgara", title: "Çapraz Kafes", category: "Izgara", props: { pattern: "diagonal-grid", fade: "center", size: 40 } },
  { id: "noktalar", title: "Noktalar", category: "Nokta", props: { pattern: "dots", size: 18 } },
  { id: "nokta-merkez", title: "Merkezde Noktalar", category: "Nokta", props: { pattern: "dots", fade: "center", size: 16 } },
  { id: "nokta-kenar", title: "Kenarda Noktalar", category: "Nokta", props: { pattern: "dots", fade: "edges", size: 16 } },
  { id: "noktali-izgara", title: "Noktalı Izgara", category: "Nokta", props: { pattern: "dot-grid", fade: "top", size: 32 } },
  { id: "nokta-isik", title: "Işıklı Noktalar", category: "Nokta", props: { pattern: "dots", fade: "bottom", glow: "horizon-bottom", tone: "primary", size: 16 } },
  { id: "capraz-cizgi", title: "Çapraz Çizgiler", category: "Çizgi", props: { pattern: "diagonal", size: 14, fade: "diagonal-br" } },
  { id: "tarama", title: "Tarama", category: "Çizgi", props: { pattern: "crosshatch", size: 16, fade: "center" } },
  { id: "dikey", title: "Dikey Çizgiler", category: "Çizgi", props: { pattern: "vertical", size: 48, fade: "bottom" } },
  { id: "yatay", title: "Yatay Çizgiler", category: "Çizgi", props: { pattern: "horizontal", size: 28, fade: "right" } },
  { id: "halkalar", title: "Halkalar", category: "Geometri", props: { pattern: "rings", size: 36, fade: "center" } },
  { id: "dama", title: "Dama", category: "Geometri", props: { pattern: "checker", size: 32, fade: "top" } },
  { id: "zikzak", title: "Zikzak", category: "Geometri", props: { pattern: "zigzag", size: 28, fade: "bottom" } },
  { id: "genis-izgara", title: "Geniş Izgara", category: "Geometri", props: { pattern: "grid", size: 64, fade: "edges", glow: "bloom", intensity: 0.25 } },
  { id: "gren", title: "Gren", category: "Doku", props: { pattern: "noise", fade: "none" } },
  { id: "gren-isik", title: "Grenli Işık", category: "Doku", props: { pattern: "noise", glow: "horizon-top", intensity: 0.5 } },
  { id: "kagit", title: "Kâğıt", category: "Doku", props: { pattern: "paper" } },
];

/** Hazır birleşimin JSX'i: kütüphanedeki "Kopyala" düğmesi bunu panoya yazar. */
export function presetSnippet(props: PatternBackgroundProps): string {
  const attrs = Object.entries(props)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (typeof v === "string" ? `${k}="${v}"` : `${k}={${v}}`))
    .join(" ");
  return `<PatternBackground ${attrs} />`;
}
