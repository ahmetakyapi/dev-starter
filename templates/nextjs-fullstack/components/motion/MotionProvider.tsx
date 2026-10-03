"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion'ın tek kök sağlayıcısı (kök layout'ta).
 *
 * `LazyMotion` + `domAnimation`: tam `motion` bileşeni yerine `m.*` ve
 * yalnızca DOM animasyon özellikleri; paket ~34 KB yerine ~15 KB. `strict`,
 * yanlışlıkla `motion.div` yazılırsa hata verir (o, tembel yüklemeyi boşa
 * çıkarır).
 *
 * `reducedMotion="user"`: işletim sistemi "hareketi azalt" diyorsa dönüşüm
 * ve düzen animasyonları kapanır, yalnızca opaklık kalır. CSS tarafındaki
 * `prefers-reduced-motion` bloğunun karşılığı.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
