"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type { StepScene } from "@/lib/content";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * "Nasıl Çalışır" sahnesi: AYNI ürün parçasının üç durumu (bağla → kural →
 * takip). Panel beyaz karo, satırlar kıl çizgiyle ayrılır (karo içinde karo
 * yok). Üstteki üç bölmeli gösterge hangi adımda olunduğunu söyler.
 *
 * `animated`: yapışkan sahnede durum değişince satırlar 60 ms arayla aşağıdan
 * gelir (AnimatePresence, `mode="wait"`: eski durum çıkmadan yenisi girmez,
 * iki durum üst üste binmez). Satır içi (telefon, hareketi azaltan) sürümde
 * hareket yok: her adımın altında kendi durumu durağan çizilir.
 */
const TONE = {
  danger: "bg-danger-wash text-danger",
  warning: "bg-warning-wash text-warning",
  success: "bg-success-wash text-success",
} as const;

function Rows({ scene }: { scene: StepScene }) {
  return scene.rows.map((row, index) => (
    <m.li
      key={row.label}
      className="flex min-h-16 items-center gap-3 border-b border-line-soft py-3 last:border-b-0"
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
        exit: { opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE } },
      }}
    >
      {scene.kind === "connect" ? (
        <>
          <span className="relative h-5 w-9 shrink-0 rounded-full bg-primary">
            <span className="absolute top-0.5 right-0.5 size-4 rounded-full bg-overlay shadow-raised" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-medium text-strong">{row.label}</span>
            <span className="block truncate text-small text-muted">{row.detail}</span>
          </span>
          {"badge" in scene ? <span className="shrink-0 text-small font-medium text-success">{scene.badge}</span> : null}
        </>
      ) : null}
      {scene.kind === "rules" ? (
        <>
          <span className="shrink-0 rounded-md bg-surface-raised px-2 py-1 font-mono text-micro text-body">{index + 1}</span>
          <span className="min-w-0 flex-1 text-base font-medium text-strong">{row.label}</span>
          {/* Sonuç sütunu sabit genişlikte: oklar alt alta hizalı durur. */}
          <span className="flex shrink-0 items-center gap-2 sm:w-44">
            <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted sm:block" />
            <span className="rounded-full bg-primary-wash px-2.5 py-1 text-small font-medium whitespace-nowrap text-primary-ink">{row.detail}</span>
          </span>
        </>
      ) : null}
      {scene.kind === "track" ? (
        <>
          <span className="min-w-0 flex-1 text-base font-medium text-strong">{row.label}</span>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-small font-medium", "tone" in row && row.tone ? TONE[row.tone] : "bg-surface-raised text-body")}>
            {row.detail}
          </span>
        </>
      ) : null}
    </m.li>
  ));
}

export function FlowScene({
  title,
  scene,
  step,
  total,
  animated = false,
  className,
}: {
  title: string;
  scene: StepScene;
  step: number;
  total: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-overlay p-5 shadow-floating sm:p-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-strong">{title}</span>
        <span className="flex gap-1">
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className="h-1 w-6 overflow-hidden rounded-full bg-surface-raised">
              <span
                className={cn(
                  "block h-full origin-left rounded-full bg-primary transition-transform duration-500",
                  index <= step ? "scale-x-100" : "scale-x-0",
                )}
              />
            </span>
          ))}
        </span>
      </div>
      <div className="mt-3">
        {animated ? (
          <AnimatePresence mode="wait" initial={false}>
            <m.ul
              key={scene.kind}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: STAGGER } } }}
            >
              <Rows scene={scene} />
            </m.ul>
          </AnimatePresence>
        ) : (
          <m.ul initial={false} animate="show">
            <Rows scene={scene} />
          </m.ul>
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 border-t border-line-soft pt-4 text-small text-muted">
        <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
        {scene.note}
      </p>
    </div>
  );
}
