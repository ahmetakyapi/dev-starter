// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Pause, Play } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Adım sekmeleri: "nasıl çalışır" bölümünün yatay şeridi. Üç-dört adım yan
 * yana; her adımda ince çizgili ikon, başlık ve iki satır açıklama. Seçili
 * adım tam renk, diğerleri soluk; altındaki sahne (`panel`) seçili adımı
 * gösterir. İsteğe bağlı kendiliğinden ilerler, ilerleme çizgisi seçili
 * adımın üstünde dolar.
 *
 * Referans turu 25 Kasım 2026: Synaps "How it works" (dört adım, seçili
 * "Select your site" koyu, diğerleri gri; altta ürün penceresi). Yalnız yapı.
 *
 * `step-rail` ile FARKI: o dikey ve süreci baştan sona ANLATIR (kaydırınca
 * dolar). Bu yatay ve SEÇİLİR: her adımın kendi sahnesi var, ziyaretçi
 * adımlar arasında gezer. `stepper` form akışıdır.
 *
 * ERİŞİLEBİLİRLİK: WAI-ARIA tabs (`tablist` / `tab` / `tabpanel`), ←→ Home
 * End ile gezilir, gezinince seçilir. `autoPlay` varsa yanında Durdur/Başlat
 * butonu (WCAG 2.2.2); üstüne gelince, odakta ve görünüm dışında durur.
 * Hareketi azaltan kullanıcıda kendiliğinden ilerleme ve geçiş yok.
 * Telefonda şerit yatay kayar (adımlar daralmaz, okunur kalır).
 */

export interface StepTab {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Adımın sahnesi; verilmezse panel çizilmez. */
  panel?: ReactNode;
}

export interface StepTabsProps {
  steps: StepTab[];
  /** Şeridin erişilebilir adı ("Nasıl Çalışır"). */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Kendiliğinden ilerleme süresi (ms); 0 kapalı. */
  autoPlay?: number;
  className?: string;
  panelClassName?: string;
}

export function StepTabs({ steps, label, value, defaultValue, onValueChange, autoPlay = 0, className, panelClassName }: StepTabsProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultValue ?? steps[0]?.id);
  const current = value ?? inner;
  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const [playing, setPlaying] = useState(autoPlay > 0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onValueChange?.(id);
  };
  // Zamanlayıcı en güncel seçiciyi çağırır; seçici her çizimde yenilenir, efekt yeniden kurulmaz.
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  useEffect(() => {
    const el = root.current;
    if (!el || !autoPlay) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlay]);

  const running = autoPlay > 0 && playing && !hold && inView && !reduce;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => selectRef.current(steps[(index + 1) % steps.length].id), autoPlay);
    return () => window.clearTimeout(t);
  }, [running, index, autoPlay, steps]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: steps.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (keys[e.key] + steps.length) % steps.length;
    select(steps[next].id);
    tabs.current[next]?.focus();
  };

  const active = steps[index];
  return (
    <div
      ref={root}
      className={cn("grid gap-8 sm:gap-10", className)}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHold(false)}
    >
      <div className="flex items-start gap-3">
        <div role="tablist" aria-label={label} className="-mx-1 flex min-w-0 flex-1 snap-x gap-6 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:gap-10">
          {steps.map((s, i) => {
            const on = i === index;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-t-${s.id}`}
                aria-selected={on}
                aria-controls={s.panel ? `${uid}-p` : undefined}
                tabIndex={on ? 0 : -1}
                onClick={() => select(s.id)}
                onKeyDown={onKey}
                className={cn(
                  "group relative grid w-60 shrink-0 snap-start content-start gap-3 pt-5 text-left outline-none sm:w-auto sm:flex-1",
                  "rounded-sm focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page",
                )}
              >
                {/* Üst iz: seçili adımda dolar (kendiliğinden ilerlemede süre boyunca). */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line">
                  {on ? (
                    <m.span
                      key={`${s.id}-${running}`}
                      className="absolute inset-y-0 left-0 w-full origin-left bg-strong"
                      initial={running ? { scaleX: 0 } : false}
                      animate={{ scaleX: 1 }}
                      transition={running ? { duration: autoPlay / 1000, ease: "linear" } : { duration: 0 }}
                    />
                  ) : null}
                </span>
                {s.icon ? (
                  <span aria-hidden className={cn("grid size-10 place-items-center transition-colors duration-300 [&_svg]:size-7 [&_svg]:stroke-[1.4]", on ? "text-strong" : "text-muted group-hover:text-body")}>
                    {s.icon}
                  </span>
                ) : null}
                <span className={cn("font-display text-heading font-semibold tracking-[-0.03em] transition-colors duration-300", on ? "text-strong" : "text-muted group-hover:text-body")}>{s.title}</span>
                {s.description ? (
                  <span className={cn("max-w-[34ch] text-read transition-colors duration-300", on ? "text-body" : "text-[color-mix(in_srgb,var(--text-muted)_70%,transparent)]")}>{s.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        {autoPlay > 0 && !reduce ? (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Adımları durdur" : "Adımları oynat"}
            className="mt-4 grid size-9 shrink-0 place-items-center rounded-full text-muted outline-none hover:bg-surface hover:text-strong focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          </button>
        ) : null}
      </div>
      {active?.panel ? (
        <div role="tabpanel" id={`${uid}-p`} aria-labelledby={`${uid}-t-${active.id}`} tabIndex={0} className={cn("relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-line-focus", panelClassName)}>
          <AnimatePresence initial={false} mode="popLayout">
            <m.div
              key={active.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {active.panel}
            </m.div>
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
