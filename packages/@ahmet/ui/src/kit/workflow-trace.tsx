// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check, Workflow } from "lucide-react";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * İş akışı izi: bir otomasyonun ya da ajanın TEK BİR İŞ üzerindeki izi.
 * Başlık satırı (ikon karo + "Sipariş Gecikmesi Algılandı" + soluk alt
 * satır), mono büyük harf künye ("İŞ AKIŞI"), dikey adımlar (renkli nokta,
 * ince bağlantı çizgisi, başlık + soluk açıklama, sağda mono zaman) ve en
 * altta kıl halkalı sonuç kutusu ("Çözüldü · Bütün sistemler eşitlendi").
 * Tanıtım sayfasının kahraman sahnesinde ya da özellik kartında "ürün bir
 * işi baştan sona böyle yürütür" demek için. Manzara turundan (2026-11-28,
 * yalnız davranış ve yapı).
 *
 * NE ZAMAN DEĞİL: canlı bir ajanın sürmekte olan planı için `agent-plan`
 * (etkin adım, kalan adım sayısı); tarihli olay geçmişi için `timeline`
 * (`<time dateTime>`, uzun liste). Bu bileşen BİTMİŞ bir işin özeti, demo.
 *
 * NASIL: `steps` sırayla çizilir; her adımın `tone`u yalnız noktanın
 * rengidir (danger, warning, primary, success, chart-1…6). Renk tek işaret
 * değil: adımın ne olduğunu başlık söyler. `animate` verilirse bileşen
 * görünüme ilk girdiğinde (`useInView`, IntersectionObserver, bir kez)
 * adımlar sırayla belirir: nokta dolar, satır aşağıdan yükselir, çizgi
 * yukarıdan aşağı çizilir, en son sonuç kutusu gelir. Hareket yalnız
 * transform ve opacity; gizleme CSS'te ve `@media (scripting: enabled)`
 * içinde (JavaScript yoksa içerik baştan görünür). Hareketi azaltan
 * kullanıcıda her şey baştan yerindedir.
 *
 * ERİŞİLEBİLİRLİK: `section`, başlığıyla adlanır (`headingLevel`, varsayılan
 * 3); adımlar `ol`, noktalar ve çizgiler `aria-hidden`. Sonuç kutusu
 * `role="status"`: statik çizimde sessiz (`aria-live="off"`), animasyonla
 * geldiğinde metni o anda bölgeye yazılır ve kibarca (polite) bir kez
 * duyurulur. Zaman düz metin (biçimi çağıranın).
 *
 *   <WorkflowTrace
 *     title="Sipariş Gecikmesi Algılandı"
 *     subtitle="Sipariş #34532 · 2 dk önce"
 *     steps={[
 *       { title: "Gecikme Tespit Edildi", detail: "Kargo 2 gündür aynı aktarma merkezinde", time: "09.42", tone: "danger" },
 *       { title: "Müşteriye Bilgi Verildi", time: "09.43", tone: "primary" },
 *     ]}
 *     result={{ title: "Çözüldü", detail: "Bütün sistemler eşitlendi", time: "09.47" }}
 *     animate
 *   />
 */

export type WorkflowTone =
  | "danger"
  | "warning"
  | "primary"
  | "success"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "chart-6";

export type WorkflowStep = {
  title: ReactNode;
  detail?: ReactNode;
  time?: ReactNode;
  tone: WorkflowTone;
};

export type WorkflowResult = {
  title: ReactNode;
  detail?: ReactNode;
  time?: ReactNode;
};

export type WorkflowTraceProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Başlığın solundaki karo; verilmezse iş akışı ikonu. */
  icon?: ReactNode;
  /** Mono büyük harf künye. */
  label?: ReactNode;
  steps: readonly WorkflowStep[];
  result?: WorkflowResult;
  /** Görünüme girince adımlar sırayla belirir (bir kez). */
  animate?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const TONE: Record<WorkflowTone, { halo: string; dot: string }> = {
  danger: { halo: "bg-danger-wash", dot: "bg-danger" },
  warning: { halo: "bg-warning-wash", dot: "bg-warning" },
  primary: { halo: "bg-primary-wash", dot: "bg-primary" },
  success: { halo: "bg-success-wash", dot: "bg-success" },
  "chart-1": { halo: "bg-[color-mix(in_oklab,var(--color-chart-1)_18%,transparent)]", dot: "bg-chart-1" },
  "chart-2": { halo: "bg-[color-mix(in_oklab,var(--color-chart-2)_18%,transparent)]", dot: "bg-chart-2" },
  "chart-3": { halo: "bg-[color-mix(in_oklab,var(--color-chart-3)_18%,transparent)]", dot: "bg-chart-3" },
  "chart-4": { halo: "bg-[color-mix(in_oklab,var(--color-chart-4)_18%,transparent)]", dot: "bg-chart-4" },
  "chart-5": { halo: "bg-[color-mix(in_oklab,var(--color-chart-5)_18%,transparent)]", dot: "bg-chart-5" },
  "chart-6": { halo: "bg-[color-mix(in_oklab,var(--color-chart-6)_18%,transparent)]", dot: "bg-chart-6" },
};

/** Adımlar arası gecikme ve tek adımın süresi (saniye). */
const STEP_GAP = 0.32;
const STEP_DUR = 0.5;

const CSS = `
.ui-wt-row, .ui-wt-dot, .ui-wt-result { transition: opacity ${STEP_DUR}s var(--ease-brand, cubic-bezier(0.22, 1, 0.36, 1)), transform ${STEP_DUR}s var(--ease-brand, cubic-bezier(0.22, 1, 0.36, 1)); transition-delay: calc(var(--wt-i) * ${STEP_GAP}s); }
.ui-wt-line { transform-origin: top; transition: transform ${STEP_DUR}s var(--ease-brand, cubic-bezier(0.22, 1, 0.36, 1)); transition-delay: calc(var(--wt-i) * ${STEP_GAP}s + ${STEP_DUR * 0.6}s); }
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .ui-wt[data-animate]:not([data-played]) .ui-wt-row { opacity: 0; transform: translateY(0.5rem); }
  .ui-wt[data-animate]:not([data-played]) .ui-wt-dot { opacity: 0; transform: scale(0.85); }
  .ui-wt[data-animate]:not([data-played]) .ui-wt-line { transform: scaleY(0); }
  .ui-wt[data-animate]:not([data-played]) .ui-wt-result { opacity: 0; transform: translateY(0.5rem); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-wt-row, .ui-wt-dot, .ui-wt-line, .ui-wt-result { transition: none; }
}`;

export function WorkflowTrace({
  title,
  subtitle,
  icon,
  label = "İş Akışı",
  steps,
  result,
  animate = false,
  headingLevel = 3,
  className,
}: WorkflowTraceProps) {
  const H = `h${headingLevel}` as ElementType;
  const headingId = useId();
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const seen = useInView(root, { once: true, amount: 0.35 });
  const played = animate && (seen || reduce === true);

  // Sonuç kutusu görününce metni canlı bölgeye yazılır: duyuru hareketle eş zamanlı.
  const [announced, setAnnounced] = useState(false);
  const resultDelayMs = Math.round((steps.length * STEP_GAP + STEP_DUR * 0.4) * 1000);
  useEffect(() => {
    if (!animate || !played || announced) return;
    const t = window.setTimeout(() => setAnnounced(true), reduce ? 0 : resultDelayMs);
    return () => window.clearTimeout(t);
  }, [animate, played, announced, reduce, resultDelayMs]);

  const resultText = result ? (
    <>
      {result.title}
      {result.detail ? <>. {result.detail}</> : null}
    </>
  ) : null;

  return (
    <section
      ref={root}
      aria-labelledby={headingId}
      data-animate={animate || undefined}
      data-played={played || undefined}
      className={cn(
        "ui-wt w-full rounded-xl bg-overlay p-4 text-left shadow-floating ring-1 ring-line-soft ring-inset sm:p-5",
        className,
      )}
    >
      <style href="ui-workflow-trace" precedence="default">
        {CSS}
      </style>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-md bg-surface text-strong ring-1 ring-line-soft ring-inset [&_svg]:size-5"
        >
          {icon ?? <Workflow strokeWidth={1.75} />}
        </span>
        <div className="min-w-0">
          <H id={headingId} className="truncate text-base font-semibold text-strong">
            {title}
          </H>
          {subtitle ? <p className="truncate text-small text-muted tabular-nums">{subtitle}</p> : null}
        </div>
      </div>

      {label ? (
        <p lang="tr" className="mt-5 mb-3 font-mono text-micro tracking-wider text-muted uppercase">
          {label}
        </p>
      ) : null}

      <ol className={cn("grid", !label && "mt-5")}>
        {steps.map((step, i) => {
          const tone = TONE[step.tone];
          const last = i === steps.length - 1;
          return (
            <li
              key={i}
              style={{ "--wt-i": i } as CSSProperties}
              className={cn("relative grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3", !last && "pb-4")}
            >
              {!last ? (
                <span aria-hidden className="ui-wt-line absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 bg-line" />
              ) : null}
              <span aria-hidden className={cn("ui-wt-dot relative grid size-6 place-items-center rounded-full", tone.halo)}>
                <span className={cn("size-2 rounded-full", tone.dot)} />
              </span>
              <div className="ui-wt-row min-w-0 pt-0.5">
                <p className="text-base font-medium text-strong">{step.title}</p>
                {step.detail ? <p className="mt-0.5 text-small text-muted">{step.detail}</p> : null}
              </div>
              <span className="ui-wt-row pt-1 font-mono text-small text-muted tabular-nums">{step.time}</span>
            </li>
          );
        })}
      </ol>

      {result ? (
        <div
          role="status"
          aria-live={animate ? "polite" : "off"}
          style={{ "--wt-i": steps.length } as CSSProperties}
          className="ui-wt-result mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg p-3 ring-1 ring-line ring-inset"
        >
          <span aria-hidden className="grid size-7 place-items-center rounded-full bg-success-wash text-success">
            <Check className="size-4" strokeWidth={2.5} />
          </span>
          {/* Animasyonda görünen metin susar, aynısı o anda gizli metin olarak bölgeye yazılır. */}
          <div className="min-w-0" aria-hidden={animate || undefined}>
            <p className="text-base font-semibold text-success">{result.title}</p>
            {result.detail ? <p className="truncate text-small text-muted">{result.detail}</p> : null}
          </div>
          <span aria-hidden={animate || undefined} className="font-mono text-small text-muted tabular-nums">
            {result.time}
          </span>
          {animate ? <span className="sr-only">{announced ? resultText : null}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
