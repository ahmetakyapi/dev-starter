"use client";

import { Check } from "lucide-react";
import { m } from "motion/react";
import { useRef } from "react";
import { useStory } from "@/hooks/useStory";
import type { FeatureDemo } from "@/lib/content";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { chartBg, initials, TILE } from "./styles";

type Rules = Extract<FeatureDemo, { kind: "rules" }>;

/*
 * Hikâye: "Bir kural yanar, bağlantı çizgisi sahibine doğru dolar, sahibin
 * karosu onay alır; sonra sıradaki kural."
 *
 * Çizgi `scaleX(0)`dan çizilir (çizgi nesne değildir, yoktan çizilmesi
 * doğru). Pasif sahip silik durur ama okunur: hangi kuralın kime gittiği
 * dinlenme karesinde de görünür.
 */
export function RulesDemo({ demo, startDelay = 0 }: { demo: Rules; startDelay?: number }) {
  const ref = useRef<HTMLUListElement>(null);
  const tick = useStory(ref, { interval: 2200, startDelay });
  const active = tick % demo.rules.length;

  return (
    <ul ref={ref} className="flex h-full flex-col justify-center gap-3">
      {demo.rules.map((rule, index) => {
        const on = index === active;
        return (
          <li key={rule.match} className="grid grid-cols-[auto_minmax(1.5rem,1fr)_auto] items-center">
            <span
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-md px-3 text-small transition-colors duration-300",
                TILE,
                on ? "text-strong" : "text-muted",
              )}
            >
              <span className="text-muted">Konu</span>
              <span className="font-semibold">{rule.match}</span>
            </span>
            <span className="relative mx-2 h-px bg-line">
              <m.span
                className="absolute inset-0 origin-left bg-primary"
                initial={false}
                animate={{ scaleX: on ? 1 : 0 }}
                transition={{ duration: DUR.slow, ease: EASE, delay: on ? 0.1 : 0 }}
              />
            </span>
            <m.span
              className={cn("flex h-10 items-center gap-2 rounded-md pr-3 pl-1.5", TILE)}
              initial={false}
              animate={{ opacity: on ? 1 : 0.55 }}
              transition={{ duration: DUR.base, ease: EASE, delay: on ? 0.35 : 0 }}
            >
              <span className={cn("grid size-7 place-items-center rounded-full text-micro font-semibold text-chart-ink", chartBg(index + 2))}>
                {initials(rule.owner)}
              </span>
              <span className="text-small font-medium text-strong">{rule.owner.split(" ")[0]}</span>
              <m.span
                className="grid size-4 place-items-center rounded-full bg-success text-on-primary [&_svg]:size-2.5"
                initial={false}
                animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.85 }}
                transition={{ duration: DUR.fast, ease: EASE, delay: on ? 0.5 : 0 }}
              >
                <Check strokeWidth={3} />
              </m.span>
            </m.span>
          </li>
        );
      })}
    </ul>
  );
}
