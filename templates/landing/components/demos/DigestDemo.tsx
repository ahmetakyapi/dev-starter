"use client";

import { m, useInView } from "motion/react";
import { useRef } from "react";
import { useStory } from "@/hooks/useStory";
import type { FeatureDemo } from "@/lib/content";
import { EASE } from "@/lib/motion";
import { TILE } from "./styles";

type Digest = Extract<FeatureDemo, { kind: "digest" }>;

/*
 * Hikâye: "Hafta akarken sütunlar nefes alır, sonra tasarımdaki boylarına
 * geri oturur." Üç adımın biri tasarım karesi; okuyucu gerçek boyu hep görür.
 *
 * Sütun iz (`bg-chart-track`) içinde AŞAĞIDAN KAYARAK yükselir (`y`),
 * `height` ya da `scaleY` ile değil: yerleşim değişmez ve köşe yarıçapı
 * ezilmez (scaleY üst köşeleri basıklaştırır). Seri rengi chart-1.
 */
const BREATH = [0.62, 1.18, 0.84, 1.1, 0.7];

export function DigestDemo({ demo, startDelay = 0 }: { demo: Digest; startDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useStory(ref, { interval: 1600, startDelay });
  // İlk görünüşte sütunlar izden çizilir (bir kez); sonrası hikâye.
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const max = Math.max(...demo.days.map((day) => day.value)) * 1.2;
  const phase = tick % 3;

  return (
    <div ref={ref} className={`flex h-full flex-col p-4 ${TILE}`}>
      <dl className="grid grid-cols-3 gap-2">
        {demo.summary.map((item) => (
          <div key={item.label}>
            <dt className="text-small text-muted">{item.label}</dt>
            <dd className="text-title font-semibold text-strong tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid flex-1 grid-cols-5 items-end gap-2">
        {demo.days.map((day, index) => {
          const factor = phase === 0 ? 1 : BREATH[(index + phase) % BREATH.length];
          const ratio = Math.min(1, (day.value * factor) / max);
          return (
            <div key={day.label} className="flex h-full min-h-0 flex-col items-center gap-1.5">
              <span className="relative w-full flex-1 overflow-hidden rounded-md bg-chart-track">
                <m.span
                  className="absolute inset-0 rounded-md bg-chart-1"
                  initial={{ y: "100%" }}
                  animate={{ y: seen ? `${(1 - ratio) * 100}%` : "100%" }}
                  transition={{ duration: 0.6, ease: EASE, delay: tick > 0 ? 0 : index * 0.06 }}
                />
              </span>
              <span className="text-micro text-muted">{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
