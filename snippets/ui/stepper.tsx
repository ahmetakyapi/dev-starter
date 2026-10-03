import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Adım göstergesi: çok adımlı bir akışta neredeyiz ("Bilgiler › Ödeme ›
 * Onay"). Sunucu bileşeni; adımlar arası geçişi akışın kendisi yönetir.
 *
 * Sıralı liste (`<ol>`): ekran okuyucu "3 öğeden 2." der. Bulunulan adım
 * `aria-current="step"`. Tamamlanan adımın durumu yalnızca onay işaretiyle
 * değil, görünmez "Tamamlandı" metniyle de söylenir.
 *
 * Telefonda dikey (etiketler sığar, açıklama okunur), `sm` üstünde yatay.
 */

export type Step = { label: ReactNode; description?: ReactNode };

type StepperProps = {
  steps: readonly Step[];
  /** Bulunulan adımın sırası, sıfırdan. */
  current: number;
  "aria-label"?: string;
  doneLabel?: string;
  className?: string;
};

export function Stepper({ steps, current, doneLabel = "Tamamlandı", className, ...props }: StepperProps) {
  return (
    <ol aria-label={props["aria-label"] ?? "Adımlar"} className={cn("flex flex-col gap-4 sm:flex-row sm:gap-0", className)}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        const last = index === steps.length - 1;
        return (
          <li
            key={index}
            aria-current={state === "current" ? "step" : undefined}
            className="relative flex min-w-0 flex-1 gap-3 sm:flex-col sm:gap-2.5"
          >
            <span className="flex items-center sm:w-full">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-small font-semibold tabular-nums transition-colors",
                  state === "done" && "border-primary bg-primary text-on-primary",
                  state === "current" && "border-primary bg-primary-wash text-primary-ink",
                  state === "upcoming" && "border-line-strong text-muted",
                )}
              >
                {state === "done" ? <Check aria-hidden className="size-4" strokeWidth={2.25} /> : index + 1}
              </span>
              {last ? null : (
                <span aria-hidden className={cn("mx-2 hidden h-px flex-1 sm:block", index < current ? "bg-primary" : "bg-line-strong")} />
              )}
            </span>
            {/* Dikeyde adımları bağlayan çizgi. */}
            {last ? null : (
              <span aria-hidden className={cn("absolute top-9 bottom-[-0.75rem] left-4 w-px sm:hidden", index < current ? "bg-primary" : "bg-line-strong")} />
            )}
            <span className="min-w-0 pt-1 sm:pt-0 sm:pr-4">
              <span className={cn("block text-base font-semibold", state === "upcoming" ? "text-muted" : "text-strong")}>
                {step.label}
                {state === "done" ? <span className="sr-only"> ({doneLabel})</span> : null}
              </span>
              {step.description ? <span className="mt-0.5 block text-small text-muted">{step.description}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
