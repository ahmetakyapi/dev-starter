"use client";

import { m } from "motion/react";
import { useRef } from "react";
import { useStory } from "@/hooks/useStory";
import type { FeatureDemo } from "@/lib/content";
import { DUR, EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TILE } from "./styles";

type Access = Extract<FeatureDemo, { kind: "access" }>;

/*
 * Hikâye: "Rol değişir, sekme göstergesi kayar, izin anahtarları o role göre
 * açılıp kapanır."
 *
 * Gösterge eşit genişlikli sütunlarda `x: N × 100%` ile kayar (ölçüm ya da
 * `layoutId` yok; domAnimation yeter). Anahtar başparmağı yayla (SPRING),
 * zemini renk geçişiyle. Dinlenme karesi ORTADAKİ rol ("Üye"): karışık
 * izinler, tek bakışta ne işe yaradığını anlatıyor; hepsi açık bir tablo
 * anlatmazdı.
 */
export function AccessDemo({ demo, startDelay = 0 }: { demo: Access; startDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useStory(ref, { interval: 2400, startDelay });
  const role = (tick + 1) % demo.roles.length;

  return (
    <div ref={ref} className={`flex h-full flex-col p-4 ${TILE}`}>
      <div className="relative grid grid-cols-3 rounded-md bg-surface-raised p-1">
        <m.span
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-sm bg-overlay shadow-raised"
          initial={false}
          animate={{ x: `${role * 100}%` }}
          transition={{ duration: DUR.base, ease: EASE }}
        />
        {demo.roles.map((name, index) => (
          <span
            key={name}
            className={cn(
              "relative py-1.5 text-center text-small font-medium transition-colors duration-200",
              index === role ? "text-strong" : "text-muted",
            )}
          >
            {name}
          </span>
        ))}
      </div>
      <ul className="mt-2 flex flex-1 flex-col justify-around">
        {demo.permissions.map((permission) => {
          const on = permission.allowed[role];
          return (
            <li key={permission.label} className="flex items-center justify-between gap-3 border-b border-line-soft py-2 last:border-b-0">
              <span className={cn("text-base transition-colors duration-200", on ? "text-strong" : "text-muted")}>{permission.label}</span>
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
                  on ? "bg-primary" : "bg-surface-raised",
                )}
              >
                <m.span
                  className="absolute top-0.5 left-0.5 size-4 rounded-full bg-overlay shadow-raised"
                  initial={false}
                  animate={{ x: on ? 16 : 0 }}
                  transition={SPRING.snappy}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
