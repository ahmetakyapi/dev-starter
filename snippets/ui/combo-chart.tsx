"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";
import { monotonePath, niceTicks } from "@/components/ui/area-chart";

/**
 * Birleşik grafik: aynı zaman ekseninde BİRİMİ FARKLI iki ölçü. Sütun
 * hacmi (aylık ciro, sipariş adedi), çizgi oranı (dönüşüm, iade oranı)
 * taşır; sol eksen sütunun, sağ eksen çizginin. İki ölçünün birimi aynıysa
 * bunu kullanma: `line-chart.tsx` ya da `area-chart.tsx` tek eksenle daha
 * dürüst.
 *
 * İKİ EKSEN, TEK IZGARA: sağ eksenin adımı solun adım SAYISINA uydurulur
 * (`alignedTicks`), böylece iki eksenin çizgileri aynı yatay hatta düşer ve
 * ızgara bir kez çizilir. İki ayrı ızgara, okuru "hangi çizgi hangi eksen"
 * sorusuyla baş başa bırakır. Hangi eksenin hangi seriye ait olduğunu üstteki
 * anahtar söyler ("Sol Eksen", "Sağ Eksen"); renk tek işaret değil, biçim de
 * (kare = sütun, nokta + çizgi = oran).
 *
 * Sütunlar HTML (`flex`, `scaleY` ile alttan büyür; çubuk olduğu için 0'dan
 * çizilmesi serbest), çizgi esneyen viewBox'ta SVG ve sütun ORTALARINDAN
 * geçer. Sütun yuvası tam genişlikte bir bant: üstüne gelince bant hafifçe
 * koyulaşır, balon iki değeri birden söyler.
 *
 * Etkileşim `area-chart` ile aynı sözleşme: fare, dokunma (`touch-pan-y`),
 * klavye (odaklan, ← → Home End, Escape), seçilen ay canlı bölgede. Veri
 * `sr-only` tabloda; çizim `aria-hidden`.
 */

type Measure = {
  /** Anahtar, balon ve tablo adı: "Ciro". */
  label: string;
  values: readonly number[];
  series?: Series;
  format?: Intl.NumberFormatOptions;
  unit?: string;
};

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const BORDER = ["border-chart-1", "border-chart-2", "border-chart-3", "border-chart-4", "border-chart-5", "border-chart-6"] as const;
const W = 600;
const H = 200;
const EASE = [0.22, 1, 0.36, 1] as const;

/** `count` aralıkta `max`ı kapsayan yuvarlak adımlar (1, 2, 2,5, 5 × 10ⁿ). Saf. */
export function alignedTicks(max: number, count: number): number[] {
  const raw = max > 0 ? max / count : 1 / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * pow >= raw - 1e-12) ?? 10) * pow;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 1e9) / 1e9);
}

export function ComboChart({
  labels,
  bars,
  line,
  title,
  height = "h-56",
  showKey = true,
  className,
}: {
  /** X ekseni: "Oca", "Şub"… */
  labels: readonly string[];
  /** Sütun ölçüsü, sol eksen. */
  bars: Measure;
  /** Çizgi ölçüsü, sağ eksen; oran için `format: { style: "percent" }` ve 0-1 değerler. */
  line: Measure;
  title: string;
  height?: string;
  /** Üstteki eksen anahtarı; kapatırsan lejantı sen ver. */
  showKey?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLElement>(null);
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const [active, setActive] = useState<number | null>(null);
  const [live, setLive] = useState("");

  const barTone = (bars.series ?? 1) - 1;
  const lineTone = (line.series ?? 3) - 1;
  const formatter = (mm: Measure, compact = false) =>
    new Intl.NumberFormat("tr-TR", compact ? { ...mm.format, notation: "compact", maximumFractionDigits: 1 } : mm.format);
  const barFull = formatter(bars);
  const lineFull = formatter(line);
  const barCompact = formatter(bars, true);
  // Oran ekseninde kısa biçim "%3,5" gibi ondalığı korusun: compact yüzdeyi yuvarlar.
  const lineAxis = line.format?.style === "percent" ? new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 }) : formatter(line, true);
  const fmtBar = (v: number) => barFull.format(v) + (bars.unit ? ` ${bars.unit}` : "");
  const fmtLine = (v: number) => lineFull.format(v) + (line.unit ? ` ${line.unit}` : "");

  const n = labels.length;
  const left = niceTicks(Math.max(...bars.values, 0));
  const right = alignedTicks(Math.max(...line.values, 0), left.length - 1);
  const leftTop = left.at(-1) || 1;
  const rightTop = right.at(-1) || 1;
  const cx = (i: number) => ((i + 0.5) / Math.max(n, 1)) * W;
  const pct = (i: number) => ((i + 0.5) / Math.max(n, 1)) * 100;
  const lineD = monotonePath(line.values.map((v, i) => [cx(i), H - (v / rightTop) * H] as const));

  const stepSm = Math.max(1, Math.ceil(n / 6));

  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.9999, Math.max(0, (event.clientX - box.left) / box.width));
    return Math.floor(ratio * n);
  };

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (n === 0) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next: number | null = null;
    if (event.key in map) next = Math.min(n - 1, Math.max(0, (active ?? (map[event.key] > 0 ? -1 : n)) + map[event.key]));
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = n - 1;
    else if (event.key === "Escape") return setActive(null);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    setLive(`${labels[next]}: ${bars.label} ${fmtBar(bars.values[next] ?? 0)}, ${line.label} ${fmtLine(line.values[next] ?? 0)}`);
  }

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Dönem</th>
              <th scope="col">{bars.label}</th>
              <th scope="col">{line.label}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label + i}>
                <th scope="row">{label}</th>
                <td>{fmtBar(bars.values[i] ?? 0)}</td>
                <td>{fmtLine(line.values[i] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showKey ? (
        <div aria-hidden className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-small">
          <span className="inline-flex items-center gap-2">
            <span className={cn("size-2.5 rounded-[3px]", SERIES_BG[barTone])} />
            <span className="font-medium text-strong">{bars.label}</span>
            <span className="text-muted">Sol Eksen</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative inline-flex w-4 items-center">
              <span className={cn("h-0.5 w-full rounded-full", SERIES_BG[lineTone])} />
              <span className={cn("absolute left-1/2 size-2 -translate-x-1/2 rounded-full border-2 bg-overlay", BORDER[lineTone])} />
            </span>
            <span className="font-medium text-strong">{line.label}</span>
            <span className="text-muted">Sağ Eksen</span>
          </span>
        </div>
      ) : null}

      <div className="flex gap-2">
        <div aria-hidden className={cn("relative w-9 shrink-0 text-micro text-muted tabular-nums", height)}>
          {left.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / leftTop) * 100}%` }}>
              {barCompact.format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            aria-label={`${title}: ok tuşlarıyla aylar arasında gezin`}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerMove={(e) => n && setActive(nearest(e))}
            onPointerDown={(e) => n && setActive(nearest(e))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            className={cn("relative touch-pan-y rounded-sm select-none", height)}
          >
            <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {left.map((t) => {
                const yy = H - (t / leftTop) * H;
                return (
                  <line
                    key={t}
                    x1={0}
                    x2={W}
                    y1={yy}
                    y2={yy}
                    strokeDasharray={t === 0 ? undefined : "3 4"}
                    vectorEffect="non-scaling-stroke"
                    className={t === 0 ? "stroke-line" : "stroke-line-soft"}
                  />
                );
              })}
            </svg>

            {/* Sütunlar: yuva bandı + alttan büyüyen çubuk */}
            <div aria-hidden className="absolute inset-0 flex">
              {bars.values.map((v, i) => (
                <div key={i} className="relative h-full min-w-0 flex-1">
                  <span
                    className={cn(
                      "absolute inset-y-0 inset-x-[6%] rounded-md bg-chart-track opacity-0 transition-opacity duration-150",
                      active === i && "opacity-100",
                    )}
                  />
                  <m.span
                    className={cn("absolute inset-x-0 bottom-0 mx-auto block w-[64%] max-w-10 origin-bottom rounded-t-[6px] rounded-b-[2px]", SERIES_BG[barTone])}
                    style={{ height: `${(v / leftTop) * 100}%` }}
                    initial={{ scaleY: 0 }}
                    animate={seen ? { scaleY: 1 } : undefined}
                    transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.04, ease: EASE }}
                  />
                </div>
              ))}
            </div>

            {/* Oran çizgisi: sütunlar çizildikten sonra belirir */}
            <m.svg
              aria-hidden
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              initial={{ opacity: 0 }}
              animate={seen ? { opacity: 1 } : undefined}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.45, ease: EASE }}
            >
              <path d={lineD} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={STROKE[lineTone]} />
            </m.svg>
            <m.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={seen ? { opacity: 1 } : undefined}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.55, ease: EASE }}
            >
              {line.values.map((v, i) => (
                <span
                  key={i}
                  className={cn(
                    "absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 bg-overlay transition-transform duration-150",
                    BORDER[lineTone],
                    active === i && "scale-125",
                  )}
                  style={{ left: `${pct(i)}%`, bottom: `${(v / rightTop) * 100}%` }}
                />
              ))}
            </m.div>

            {active !== null && n > 0 ? (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-1 min-w-40 rounded-md bg-overlay px-2.5 py-2 shadow-floating",
                  pct(active) > 55 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
                )}
                style={{ left: `${pct(active)}%` }}
              >
                <p className="text-micro text-muted">{labels[active]}</p>
                <ul className="mt-1 space-y-0.5">
                  <li className="flex items-center gap-1.5 text-small whitespace-nowrap">
                    <span className={cn("size-2 shrink-0 rounded-[3px]", SERIES_BG[barTone])} />
                    <span className="text-muted">{bars.label}</span>
                    <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{fmtBar(bars.values[active] ?? 0)}</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-small whitespace-nowrap">
                    <span className={cn("size-2 shrink-0 rounded-full", SERIES_BG[lineTone])} />
                    <span className="text-muted">{line.label}</span>
                    <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{fmtLine(line.values[active] ?? 0)}</span>
                  </li>
                </ul>
              </div>
            ) : null}

            {n === 0 ? <p className="absolute inset-0 grid place-items-center text-small text-muted">Bu dönem için veri yok</p> : null}
          </div>

          <div aria-hidden className="mt-2 flex text-micro text-muted">
            {labels.map((label, i) => (
              // Yuva dar olsa da etiket kesilmez: ortada durur, iki yana eşit taşar.
              <span key={label + i} className={cn("flex min-w-0 flex-1 justify-center", i % stepSm !== 0 && "max-sm:invisible")}>
                <span className="whitespace-nowrap">{label}</span>
              </span>
            ))}
          </div>
        </div>

        <div aria-hidden className={cn("relative w-10 shrink-0 text-micro text-muted tabular-nums", height)}>
          {right.map((t) => (
            <span key={t} className="absolute left-0 translate-y-1/2" style={{ bottom: `${(t / rightTop) * 100}%` }}>
              {lineAxis.format(t)}
            </span>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </figure>
  );
}
