"use client";

import { m, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Biçim değiştiren ikon: iki hal arasında çizgileri yeniden dizerek geçen
 * ikon. Menü ↔ kapat, artı ↔ eksi, oynat ↔ duraklat, aşağı ↔ yukarı,
 * kopyala sonrası onay. İkon değişimi bir ANLAM değişimi olduğunda (aynı
 * düğmenin iki hali) çapraz solma yerine biçim kayar: göz düğmenin aynı
 * düğme olduğunu, yalnız halinin değiştiğini görür.
 *
 * YAPI: her biçim 24 × 24 kutuda üç çizgi. Geçişte çizgilerin uçları yayla
 * yeni konumuna kayar (`SPRING.snappy`); biçimde gerekmeyen çizgi bir
 * noktaya toplanıp söner (sıfırdan büyüyen nesne değil, uçları birleşen
 * çizgi). Lucide'in çizgi dili: yuvarlak uç, 2 kalınlık, `currentColor`.
 *
 * İkon `aria-hidden`: hal bilgisi düğmenin adında ya da `aria-pressed`ında
 * ("Menüyü Aç" / "Menüyü Kapat"). Hareketi azaltan kullanıcıda yerinde
 * değişir.
 *
 *   <button aria-expanded={open} aria-label={open ? "Menüyü Kapat" : "Menüyü Aç"}>
 *     <MorphIcon icon={open ? "close" : "menu"} />
 *   </button>
 */

type Line = readonly [x1: number, y1: number, x2: number, y2: number];
type Shape = readonly [Line, Line, Line];

/** Toplanmış (görünmez) çizgi: ortada tek nokta. */
const DOT: Line = [12, 12, 12, 12];

const SHAPES = {
  menu: [[4, 6, 20, 6], [4, 12, 20, 12], [4, 18, 20, 18]],
  close: [[6, 6, 18, 18], DOT, [6, 18, 18, 6]],
  plus: [[12, 5, 12, 19], [5, 12, 19, 12], DOT],
  minus: [[5, 12, 19, 12], [5, 12, 19, 12], DOT],
  check: [[5, 12.5, 10, 17.5], [10, 17.5, 19, 7], DOT],
  "chevron-down": [[6, 9, 12, 15], [12, 15, 18, 9], DOT],
  "chevron-up": [[6, 15, 12, 9], [12, 9, 18, 15], DOT],
  "arrow-right": [[5, 12, 19, 12], [13, 6, 19, 12], [13, 18, 19, 12]],
  "arrow-left": [[5, 12, 19, 12], [11, 6, 5, 12], [11, 18, 5, 12]],
  play: [[8, 5, 8, 19], [8, 5, 19, 12], [8, 19, 19, 12]],
  pause: [[9, 6, 9, 18], [15, 6, 15, 18], DOT],
} as const satisfies Record<string, Shape>;

export type MorphShape = keyof typeof SHAPES;

const isDot = (l: Line) => l[0] === l[2] && l[1] === l[3];

type MorphIconProps = {
  icon: MorphShape;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function MorphIcon({ icon, size = 20, strokeWidth = 2, className }: MorphIconProps) {
  const reduce = useReducedMotion();
  const lines: Shape = SHAPES[icon];
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {lines.map((l, i) => (
        <m.line
          key={i}
          initial={false}
          animate={{ x1: l[0], y1: l[1], x2: l[2], y2: l[3], opacity: isDot(l) ? 0 : 1 }}
          transition={reduce ? { duration: 0 } : SPRING.snappy}
        />
      ))}
    </svg>
  );
}
