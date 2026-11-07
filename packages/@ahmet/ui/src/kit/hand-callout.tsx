// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode, type RefObject } from "react";
import { cn } from "../utils";

/**
 * El yazısıyla not ve çizilerek gelen ok: arayüzün bir noktasını kenardan
 * gösterir. Ribbon'ın canlı demosundaki "turn ribbon on" notu, menü
 * çubuğundaki küçük simgeyi işaret eder; kimse aramadan bulur. Kullanım:
 * canlı demoda ilk dokunulacak yer, fiyat kartında "en çok seçilen",
 * ekran görüntüsünde yeni özellik. Sayfada BİR, en çok iki tane.
 *
 * `mark-annotate`tan farkı: o metnin ÜSTÜNE çizer (altı çizgi, daire);
 * bu metnin DIŞINDA durur ve okla başka bir öğeyi gösterir.
 *
 * YAZI TİPİ: `--font-hand-face` (snippets/fonts/fonts.ts → `handFont`,
 * Caveat; latin + latin-ext ile ğ ş İ ı ve ₺ yerinde). Tanımlı değilse
 * sistemin el yazısı ailesine düşer. Not kısa olmalı: üç-dört sözcük, küçük harf, noktasız.
 *
 * YÖN: ok notun altından ya da üstünden çıkar, sağa ya da sola kıvrılır.
 * Konumu çağıran verir (`absolute -top-16 right-0` gibi); bileşen yalnızca
 * notu ve oku çizer. Telefonda hedefin yanında yer yoksa `hidden sm:flex`.
 *
 * ERİŞİLEBİLİRLİK: varsayılan süs (`aria-hidden`); söylediği şey sayfada
 * metin olarak da bulunmalı. `onClick` verilirse gerçek düğme olur ve notun
 * kendisi adıdır (Ribbon'da not, demoyu açan düğmenin ikinci yoluydu).
 * Hareketi azaltan kullanıcıda ok doğrudan çizili.
 */

type Direction = "down-right" | "down-left" | "up-right" | "up-left";

type HandCalloutProps = {
  children: ReactNode;
  direction?: Direction;
  /** Notun eğimi, derece. Eksi sola yatık. */
  tilt?: number;
  /** Çizime başlamadan bekleme, ms (görünür olduktan sonra). */
  delay?: number;
  onClick?: () => void;
  className?: string;
};

export function HandCallout({ children, direction = "down-right", tilt = -6, delay = 150, onClick, className }: HandCalloutProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const drawn = inView || reduce;
  const up = direction.startsWith("up");
  const left = direction.endsWith("left");

  const label = (
    <span
      className="font-[family-name:var(--font-hand-face,cursive)] text-heading leading-none font-bold text-strong"
      style={{ rotate: `${tilt}deg` }}
    >
      {children}
    </span>
  );

  // Yol bir kez çizilir, yön aynalanarak verilir: aynı el, dört yön.
  const arrow = (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden
      className={cn("h-20 w-[4.5rem] text-strong", left && "-scale-x-100", up && "-scale-y-100")}
    >
      <path
        d="M30 4 C 34 36, 44 70, 66 100"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray={1}
        strokeDashoffset={drawn ? 0 : 1}
        style={{ transition: reduce ? "none" : `stroke-dashoffset 900ms var(--ease-brand) ${delay}ms` }}
      />
      <path
        d="M52 92 L66 100 L62 83"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={drawn ? 1 : 0}
        style={{ transition: reduce ? "none" : `opacity 200ms ease-out ${delay + 800}ms` }}
      />
    </svg>
  );

  const body = (
    <>
      {up ? arrow : label}
      {up ? label : arrow}
    </>
  );
  const layout = cn("flex flex-col select-none", left ? "items-start" : "items-end", className);

  if (onClick) {
    return (
      <button
        ref={ref as RefObject<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={cn(layout, "cursor-pointer rounded-md transition-transform duration-200 hover:-translate-y-0.5")}
      >
        {body}
      </button>
    );
  }
  return (
    <span ref={ref as RefObject<HTMLSpanElement>} aria-hidden className={layout}>
      {body}
    </span>
  );
}
