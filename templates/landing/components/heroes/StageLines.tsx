"use client";

import { m, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";

/*
 * scroll-stage: bölüm üç ekran boyu, sahne yapışkan; kaydırdıkça üç cümle
 * aynı yerde sırayla değişir. İlk cümle ilk karede görünür (opaklığı 1'den
 * başlar). Hareketi azaltan ve JavaScript'i kapalı okuyucuda üç cümle alt
 * alta durur: kararı CSS veriyor (app/landing.css → `.stage`).
 *
 * Aralıklar üst üste biner: bir cümle çıkarken öteki girer, arada boş kare
 * kalmaz. Sayılar kaydırma payının oranı.
 */
const RANGES = [
  { input: [0, 0.28, 0.36], opacity: [1, 1, 0], y: [0, 0, -24] },
  { input: [0.28, 0.36, 0.61, 0.69], opacity: [0, 1, 1, 0], y: [24, 0, 0, -24] },
  { input: [0.61, 0.69, 1], opacity: [0, 1, 1], y: [24, 0, 0] },
] as const;

function Line({ text, index, progress }: { text: string; index: number; progress: MotionValue<number> }) {
  const range = RANGES[index] ?? RANGES[0];
  const opacity = useTransform(progress, [...range.input], [...range.opacity]);
  const y = useTransform(progress, [...range.input], [...range.y]);
  return (
    <m.p className="stage-line text-heading font-semibold text-strong sm:text-display" style={{ opacity, y }}>
      {text}
    </m.p>
  );
}

export function StageFrame({
  lines,
  head,
  actions,
}: {
  lines: readonly string[];
  head: ReactNode;
  actions: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <div ref={ref} className="stage">
      <div className="stage-pin mx-auto flex max-w-6xl flex-col px-4 pt-24 pb-10 sm:justify-center sm:px-6 sm:pt-16">
        {head}
        <div className="stage-lines mt-8 max-w-3xl sm:mt-10">
          {lines.map((text, index) => (
            <Line key={text} text={text} index={index} progress={scrollYProgress} />
          ))}
        </div>
        {actions}
      </div>
    </div>
  );
}
