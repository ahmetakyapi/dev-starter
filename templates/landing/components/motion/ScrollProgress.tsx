"use client";

import { m, useScroll, useSpring } from "motion/react";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Sayfanın ne kadarının geçildiğini gösteren ince çubuk (uzun landing'de
 * okuyucuya "daha ne kadar var" cevabı). `scaleX` ile büyür, `width` ile
 * değil: transform yalnızca birleştirir, yerleşimi yeniden hesaplatmaz.
 * Hareketi azaltan okuyucuda yay kapanır, çubuk kaydırmayı birebir izler.
 * Yalnızca görsel; ilerlemeyi ekran okuyucuya duyurmak gürültü olurdu.
 */
const SPRING = { stiffness: 220, damping: 32, restDelta: 0.001 } as const;

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, SPRING);
  const reduce = useMotionPreference();

  return (
    <m.div
      aria-hidden
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
      className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-primary"
    />
  );
}
