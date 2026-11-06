// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useInView, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Elle işaretleme: metnin üstüne kalemle çizilmiş gibi altı çizgi, fosforlu
 * kalem, daire, kutu ya da üstü çizili. Görünür olunca çizilerek gelir.
 * Kahraman cümlesinde TEK vurgu ("üç komutta kurulum"), fiyat tablosunda
 * eski fiyatın üstü çizgisi, yardım metninde dikkat edilecek sözcük.
 * Sayfada en çok iki-üç tane: her şeyi işaretlemek hiçbir şeyi işaretlemez.
 *
 * NASIL: sarmalanan metnin kutusu ölçülür (`ResizeObserver`), üstüne aynı
 * boyda SVG yol çizilir. Yollar elle çizim gibi hafif eğri ve titrek;
 * titreklik metinden türeyen sabit tohumla, her çizimde aynı (sunucu ile
 * istemci farkı yok, yeniden çizimde zıplamaz). Çizim `pathLength=1` +
 * `stroke-dashoffset` geçişi, 700 ms `--ease-brand`.
 *
 * Fosforlu kalem metnin ARKASINDA (`-z-1`, kap `isolate`), birincil rengin
 * %30'u: metin kontrastı düşmez. Diğerleri metnin üstünde, ince.
 *
 * Kısa ifadede kullan: sarmalanan metin satır kırılmaz (`whitespace-nowrap`).
 * İşaret süstür (`aria-hidden`); anlam taşıyorsa (eski fiyat) metinle de
 * söyle (`<s>`, "eski fiyat"). Hareketi azaltan kullanıcıda doğrudan çizili.
 *
 *   <MarkAnnotate type="underline">üç komutta</MarkAnnotate>
 */

export type AnnotateType = "underline" | "highlight" | "circle" | "box" | "strike";

const TONE = { primary: "var(--primary)", warning: "var(--warning)", strong: "var(--text-strong)" } as const;

/** Metinden türeyen sabit sözde rastgele: aynı metin her yerde aynı titreklik. */
function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646 - 0.5;
  };
}

function pathFor(type: AnnotateType, w: number, h: number, rnd: () => number) {
  const j = (n: number) => rnd() * n;
  switch (type) {
    case "underline":
      return `M ${j(2)} ${h + 2 + j(1.5)} Q ${w / 2} ${h + 4 + j(2)} ${w + j(2)} ${h + 1 + j(1.5)}`;
    case "strike":
      return `M ${-2 + j(2)} ${h * 0.55 + j(2)} Q ${w / 2} ${h * 0.5 + j(2)} ${w + 2 + j(2)} ${h * 0.52 + j(2)}`;
    case "highlight":
      return `M ${-3} ${h * 0.6 + j(1)} L ${w + 3} ${h * 0.56 + j(1)}`;
    case "box": {
      const p = 4;
      return `M ${-p + j(2)} ${-p + j(2)} L ${w + p + j(2)} ${-p + j(2)} L ${w + p + j(2)} ${h + p + j(2)} L ${-p + j(2)} ${h + p + j(2)} Z`;
    }
    case "circle": {
      const rx = w / 2 + 8;
      const ry = h / 2 + 6;
      const pts: string[] = [];
      const turns = 1.12;
      const steps = 44;
      const start = -2.2;
      for (let i = 0; i <= steps; i++) {
        const a = start + (i / steps) * Math.PI * 2 * turns;
        const wob = 1 + j(0.06);
        pts.push(`${(w / 2 + Math.cos(a) * rx * wob).toFixed(1)} ${(h / 2 + Math.sin(a) * ry * wob).toFixed(1)}`);
      }
      return `M ${pts[0]} L ${pts.slice(1).join(" L ")}`;
    }
  }
}

type MarkAnnotateProps = {
  children: ReactNode;
  type?: AnnotateType;
  tone?: keyof typeof TONE;
  /** Denetimli: verilirse görünürlük yerine bu (`true` çizer, `false` siler). */
  show?: boolean;
  /** Çizim başlamadan önceki bekleme (ms); birden çok işaret sırayla. */
  delay?: number;
  className?: string;
};

export function MarkAnnotate({ children, type = "underline", tone = "primary", show, delay = 0, className }: MarkAnnotateProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const drawn = show ?? inView;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBox({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const text = ref.current?.textContent ?? "";
  const seed = [...text].reduce((n, ch) => n + ch.charCodeAt(0), 7);
  const d = box ? pathFor(type, box.w, box.h, seeded(seed)) : null;
  const highlight = type === "highlight";
  const width = highlight ? (box ? box.h * 0.78 : 0) : type === "underline" || type === "strike" ? 2.5 : 2;

  return (
    <span ref={ref} className={cn("relative isolate inline-block whitespace-nowrap", className)}>
      {children}
      {d && box ? (
        <svg
          aria-hidden
          className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", highlight && "-z-1")}
          width={box.w}
          height={box.h}
        >
          <path
            d={d}
            fill="none"
            pathLength={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={width}
            style={
              {
                stroke: highlight ? `color-mix(in oklab, ${TONE[tone]} 30%, transparent)` : TONE[tone],
                strokeDasharray: 1,
                strokeDashoffset: drawn ? 0 : 1,
                transition: reduce ? "none" : `stroke-dashoffset 0.7s var(--ease-brand) ${delay}ms`,
              } as CSSProperties
            }
          />
        </svg>
      ) : null}
    </span>
  );
}
