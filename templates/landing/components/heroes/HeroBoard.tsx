"use client";

import { Check, ChevronDown } from "lucide-react";
import { m, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { TILE } from "@/components/demos/styles";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { useFinePointer } from "@/hooks/useFinePointer";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { useStory } from "@/hooks/useStory";
import { SAMPLE_NOTE, type HeroBoard as HeroBoardData } from "@/lib/content";
import { cn } from "@/lib/utils";

/*
 * showcase hero'sunun canlı panosu: ürünün GERÇEK arayüz parçaları, ekran
 * görüntüsü değil. Gri kuyu içinde beyaz karolar (board dili, tek seviye).
 *
 * Giriş hareketleri CSS'te (app/landing.css → "Hero panosu"): hidrasyonu
 * beklemez, JavaScript kapalıyken de oynar. Huni çubukları soldan sağa
 * `clip-path` ile dolar, hafta sütunları aşağıdan; sayı `RollingNumber`la
 * yuvarlanır (yalnızca ilk ekranda, kuralına uygun). Talep adımları tek
 * saatten (`useStory`) ilerler.
 *
 * PARALAKS: karolar imlece göre farklı derinlikte birkaç piksel kayar
 * (en fazla 10 px; guides/04 § 13 "bir ekranda tek katman" bu pano).
 * Yalnızca hassas işaretçide ve hareket serbestken; konum motion value'da,
 * React durumunda değil (fare kıpırdadıkça ağaç yeniden çizilmez).
 * Dinleyici pasif ve yalnızca bu koşullarda bağlanır.
 */
const DEPTH = { funnel: 4, closed: 10, thread: 7 } as const;
const SPRING = { stiffness: 90, damping: 20, mass: 0.6 } as const;

function usePointerParallax(enabled: boolean) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, SPRING);
  const y = useSpring(py, SPRING);

  useEffect(() => {
    if (!enabled) {
      px.set(0);
      py.set(0);
      return;
    }
    const onMove = (event: PointerEvent) => {
      px.set(event.clientX / window.innerWidth - 0.5);
      py.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, px, py]);

  return { x, y };
}

function Layer({
  pointer,
  depth,
  className,
  children,
}: {
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
  className?: string;
  children: ReactNode;
}) {
  const x = useTransform(pointer.x, (value) => value * -depth * 2);
  const y = useTransform(pointer.y, (value) => value * -depth * 2);
  return (
    <m.div style={{ x, y }} className={className}>
      {children}
    </m.div>
  );
}

const percent = (value: number, base: number) => `%${Math.round((value / base) * 100)}`;

export function HeroBoard({ board }: { board: HeroBoardData }) {
  const fine = useFinePointer();
  const reduce = useMotionPreference();
  const pointer = usePointerParallax(fine && !reduce);
  const threadRef = useRef<HTMLDivElement>(null);
  const tick = useStory(threadRef, { interval: 1400, startDelay: 2200 });

  const { funnel, closed, thread } = board;
  const base = funnel.stages[0]?.value ?? 1;
  const weeklyMax = Math.max(...closed.weekly);
  const steps = thread.steps.length;
  // Dinlenme karesi: bütün adımlar tamam. Sonra yeni bir talep baştan yürür.
  const done = tick === 0 ? steps : tick % (steps + 1);

  return (
    <figure
      aria-label={board.label}
      className="hero-board rounded-2xl bg-surface p-2 sm:p-3"
    >
      <div aria-hidden>
        <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3 sm:px-3">
          <span className="text-base font-semibold text-strong">{board.title}</span>
          <span className="rounded-full border border-line bg-overlay px-2.5 py-0.5 text-micro font-medium text-muted">{SAMPLE_NOTE}</span>
        </div>

        <div className="grid gap-2 sm:gap-3 lg:grid-cols-12">
          <Layer pointer={pointer} depth={DEPTH.funnel} className="min-w-0 lg:col-span-7">
            <div className={cn("flex h-full flex-col p-4 sm:p-6", TILE)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-small text-muted">{funnel.title}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-heading font-semibold tracking-tight text-strong tabular-nums">
                      {percent(funnel.stages[funnel.stages.length - 1]?.value ?? 0, base)}
                    </span>
                    <span className="text-small text-muted">{funnel.rateLabel}</span>
                  </p>
                </div>
                <span className="flex h-9 items-center gap-1 rounded-md border border-line px-3 text-small font-medium text-strong">
                  {board.range}
                  <ChevronDown className="size-3.5 text-muted" />
                </span>
              </div>
              <ul className="mt-5 flex flex-1 flex-col justify-around gap-2.5 sm:mt-6 sm:gap-3">
                {funnel.stages.map((stage, index) => (
                  <li key={stage.label} className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_6rem]">
                    <span className="truncate text-small text-body sm:text-base">{stage.label}</span>
                    <span className="h-6 overflow-hidden rounded-md bg-chart-track sm:h-7">
                      <span
                        className={cn("bar-fill block h-full rounded-md", ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"][index % 4])}
                        style={{ width: `${(stage.value / base) * 100}%`, "--i": index } as CSSProperties}
                      />
                    </span>
                    <span className="flex items-baseline justify-end gap-2 tabular-nums">
                      <span className="text-base font-semibold text-strong">{stage.value.toLocaleString("tr-TR")}</span>
                      <span className="hidden w-9 text-right text-small text-muted sm:inline">{percent(stage.value, base)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Layer>

          <div className="grid min-w-0 gap-2 sm:grid-cols-2 sm:gap-3 lg:col-span-5 lg:grid-cols-1">
            <Layer pointer={pointer} depth={DEPTH.closed} className="min-w-0">
              <div className={cn("h-full p-4 sm:p-5", TILE)}>
                <p className="text-small text-muted">{closed.title}</p>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="metric-figure font-semibold text-strong">
                    <RollingNumber value={closed.value} delayMs={450} />
                  </span>
                  <span className="rounded-full bg-success-wash px-2 py-0.5 text-small font-semibold text-success">{closed.delta}</span>
                </div>
                <div className="mt-4 grid h-14 grid-cols-7 items-end gap-1.5">
                  {closed.weekly.map((value, index) => (
                    <span key={closed.days[index]} className="flex h-full flex-col justify-end overflow-hidden rounded-sm bg-chart-track">
                      <span
                        className="col-rise block rounded-sm bg-chart-2"
                        style={{ height: `${(value / weeklyMax) * 100}%`, "--i": index } as CSSProperties}
                      />
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5 text-center text-micro text-muted">
                  {closed.days.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </Layer>

            <Layer pointer={pointer} depth={DEPTH.thread} className="hidden min-w-0 sm:block">
              <div ref={threadRef} className={cn("h-full p-4 sm:p-5", TILE)}>
                <p className="text-small text-muted">{thread.title}</p>
                <ol className="mt-3 space-y-2.5">
                  {thread.steps.map((step, index) => {
                    const state = index < done ? "done" : index === done ? "active" : "pending";
                    return (
                      <li key={step.label} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300 [&_svg]:size-3.5",
                            state === "done" && "bg-success-wash text-success",
                            state === "active" && "bg-primary-wash",
                            state === "pending" && "border border-line",
                          )}
                        >
                          {state === "done" ? <Check strokeWidth={2.75} /> : null}
                          {state === "active" ? <span className="step-pulse size-2 rounded-full bg-primary" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-base font-medium transition-colors duration-300">
                          <span className={state === "pending" ? "text-muted" : "text-strong"}>{step.label}</span>
                        </span>
                        <span className="shrink-0 text-small text-muted">{state === "done" ? step.time : thread.pending}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Layer>
          </div>
        </div>
      </div>
    </figure>
  );
}
