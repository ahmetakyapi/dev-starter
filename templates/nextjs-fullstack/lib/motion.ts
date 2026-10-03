import type { Transition, Variants } from "motion/react";

/**
 * Hareket sözleşmesi. Bu dosya "use client" DEĞİL: sabitler sunucu
 * bileşenlerinden de okunabilsin diye. `"use client"` bir modülden dışa
 * aktarılan değer sunucuya gerçek değer olarak gelmez, istemci referansına
 * dönüşür ve bunu ne derleyici ne çalışma zamanı söyler.
 *
 * CSS tarafının karşılığı `--ease-brand` (app/globals.css); iki eğri aynı.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DUR = { fast: 0.16, base: 0.28, slow: 0.5, page: 0.6 } as const;

export const SPRING = {
  snappy: { type: "spring", stiffness: 500, damping: 40 },
  soft: { type: "spring", stiffness: 120, damping: 22, mass: 0.8 },
} as const satisfies Record<string, Transition>;

export const STAGGER = 0.06;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE } },
};

/** Kapsayıcı varyantı: çocuklar `STAGGER` aralıkla sırayla gelir. */
export function stagger(delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER, delayChildren: delay } },
  };
}
