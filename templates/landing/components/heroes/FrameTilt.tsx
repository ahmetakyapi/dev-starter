"use client";

import { m, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Ürün çerçevesi hafifçe geriye yatık başlar, kaydırdıkça düzleşir: "ekran
 * okuyucuya doğru dönüyor". Değer kaydırmadan türer (useScroll), React
 * durumuna girmez. Hareketi azaltanda düz; ilk kare için CSS'te de
 * `.frame-tilt` kuralı var.
 */
const TILT_DEG = 12;
const START_SCALE = 0.95;

export function FrameTilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [TILT_DEG, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [START_SCALE, 1]);

  return (
    <div ref={ref} className={`frame-stage ${className ?? ""}`}>
      <m.div
        className="frame-tilt origin-bottom"
        style={reduce ? undefined : { rotateX, scale }}
      >
        {children}
      </m.div>
    </div>
  );
}
