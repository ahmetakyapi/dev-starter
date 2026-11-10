"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";
import { monotonePath, niceTicks } from "@/components/ui/area-chart";

/**
 * Çizgi grafiği: sıralı bir eksende 2-5 seriyi KIYASLAMAK için (kanal başına
 * aylık kayıt, şube başına haftalık satış). Bir ya da iki dönemin hacmi
 * okunacaksa `area-chart.tsx` (dolgu hacmi anlatır); burada dolgu yok, çünkü
 * beş dolgu üst üste binince hiçbiri okunmaz.
 *
 * LEJANT AYNI ZAMANDA SÜZGEÇ: her seri bir `aria-pressed` düğmesi; tıklayınca
 * çizgi söner ve Y ekseni KALAN serilere göre yeniden ölçeklenir (küçük bir
 * seri büyüğün gölgesinde düz çizgi gibi kalmasın). Son görünen seri
 * gizlenemez: boş grafik bir cevap değil. Gizli seri balonda da tabloda da
 * yok sayılmaz; `sr-only` tablo HER ZAMAN bütün veriyi taşır.
 *
 * ÇİZGİ BİÇİMİ İKİ İŞARET: renk ve desen. `dashed` seri kesik çizilir
 * (tahmin, geçen yıl); renk körlüğünde ya da gri baskıda da ayrışır.
 * `markers` her veri noktasına küçük bir halka koyar; az noktalı (≤ 12)
 * seride ölçümün nerede olduğunu gösterir, çok noktalıda kalabalık yapar.
 *
 * HEDEF ÇİZGİSİ (`target`): yatay, kıl kalınlığında kesik çizgi ve sağ
 * uçta küçük bir hap ("Hedef 5.000"). Ekseni hedefi de kapsayacak kadar
 * açar: hedefin grafik dışında kalması onu yok saymaktır. Renk değil
 * `line-strong`: hedef bir seri değil, ölçüt.
 *
 * Çizim tekniği `area-chart.tsx` ile aynı: esneyen viewBox +
 * `non-scaling-stroke`, işaretler HTML (yamulmasın), ilk çizim kırpma
 * perdesiyle soldan (`scaleX`, `pathLength` değil). Ölçek değişince çizgiler
 * yeni yerlerine `d` interpolasyonuyla kayar (aynı komut sayısı, düz geçiş).
 * Hareket azaltmada her şey son halinde, geçiş yok.
 *
 * Etkileşim: fare, dokunma (`touch-pan-y`) ve klavye (odaklan, ← → Home
 * End, Escape). Balon yalnız GÖRÜNEN serileri değere göre sıralı listeler;
 * klavyeyle seçilen nokta canlı bölgede okunur.
 */

export type LineSeries = {
  /** Lejant, balon ve tablo adı: "Organik". */
  label: string;
  values: readonly number[];
  series?: Series;
  /** Kesik çizgi: tahmin, geçen dönem. */
  dashed?: boolean;
};

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const W = 600;
const H = 200;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Lejant-süzgeç: seri başına bir `aria-pressed` düğme. `scatter-chart` da kullanır. */
export function SeriesToggles({
  items,
  hidden,
  onToggle,
  label,
  className,
}: {
  items: readonly { key: string; label: string; series: Series; dashed?: boolean }[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Grubun adı: "Gösterilen seriler". */
  label: string;
  className?: string;
}) {
  const visible = items.filter((item) => !hidden.has(item.key)).length;
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => {
        const on = !hidden.has(item.key);
        const last = on && visible === 1;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={on}
            // Son görünen seri kapatılamaz; düğme odakta kalsın diye `disabled` değil.
            aria-disabled={last || undefined}
            title={last ? "En az bir seri görünür kalır" : undefined}
            onClick={() => !last && onToggle(item.key)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border px-3 text-small font-medium transition-[background-color,border-color,color,box-shadow] duration-150 pointer-fine:h-8",
              on ? "border-line bg-overlay text-strong shadow-raised" : "border-dashed border-line-strong bg-transparent text-muted hover:text-body",
              last && "cursor-not-allowed",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "relative h-0.5 w-3.5 shrink-0 rounded-full transition-opacity duration-150",
                SERIES_BG[item.series - 1],
                !on && "opacity-35",
                // Kesik seri lejantta da kesik: iki parça.
                item.dashed && "w-1.5 after:absolute after:top-0 after:left-2 after:h-0.5 after:w-1.5 after:rounded-full after:bg-inherit",
              )}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function LineChart({
  labels,
  series,
  title,
  valueFormat,
  unit,
  target,
  markers = false,
  defaultHidden = [],
  showToggles = true,
  height = "h-56",
  className,
}: {
  /** X ekseni etiketleri, kısa: "Oca", "12 Eki". Seri değerleriyle aynı uzunlukta. */
  labels: readonly string[];
  /** 2-5 seri; sıra lejantla aynı. */
  series: readonly LineSeries[];
  /** Grafiğin ve tablonun adı: "Kanala Göre Yeni Kayıt". */
  title: string;
  valueFormat?: Intl.NumberFormatOptions;
  unit?: string;
  /** Yatay hedef çizgisi: `{ value: 5000, label: "Hedef" }`. */
  target?: { value: number; label?: string };
  /** Her veri noktasına halka. */
  markers?: boolean;
  /** Başta gizli serilerin adları. */
  defaultHidden?: readonly string[];
  /** Lejant-süzgeç düğmeleri; kapatılırsa lejantı sen ver (`ChartLegend`). */
  showToggles?: boolean;
  height?: string;
  className?: string;
}) {
  const clip = `line-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotion();
  const frame = useRef<HTMLElement>(null);
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const [active, setActive] = useState<number | null>(null);
  const [live, setLive] = useState("");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => {
    const start = new Set(defaultHidden);
    // Hepsi gizli başlatılırsa ilki görünür kalır.
    if (series.length && series.every((s) => start.has(s.label))) start.delete(series[0].label);
    return start;
  });

  const full = new Intl.NumberFormat("tr-TR", valueFormat);
  const compact = new Intl.NumberFormat("tr-TR", { ...valueFormat, notation: "compact", maximumFractionDigits: 1 });
  const fmt = (v: number) => full.format(v) + (unit ? ` ${unit}` : "");

  const tone = (s: LineSeries, i: number) => (s.series ?? (((i % 6) + 1) as Series)) - 1;
  const shown = series.map((s, i) => ({ s, i })).filter(({ s }) => !hidden.has(s.label));
  const n = labels.length;
  const max = Math.max(...shown.flatMap(({ s }) => s.values), target?.value ?? 0, 0);
  const ticks = niceTicks(max);
  const top = ticks.at(-1) || 1;
  const x = (i: number) => (n < 2 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / top) * H;
  const pct = (i: number) => (n < 2 ? 50 : (i / (n - 1)) * 100);
  const hPct = (v: number) => (v / top) * 100;

  const stepSm = Math.max(1, Math.ceil(n / 5));
  const stepLg = Math.max(1, Math.ceil(n / 10));
  // Son etiket sağa yaslı: ona bir tam adımdan yakın düşen etiket gizlenir (area-chart ile aynı).
  const showTick = (i: number, step: number) => i === n - 1 || (i % step === 0 && n - 1 - i >= step);

  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    return Math.round(ratio * (n - 1));
  };

  const rowsAt = (i: number) =>
    shown.map(({ s, i: si }) => ({ s, si, v: s.values[i] ?? 0 })).sort((a, b) => b.v - a.v);

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
    setLive(`${labels[next]}: ${rowsAt(next).map(({ s, v }) => `${s.label} ${fmt(v)}`).join(", ")}`);
  }

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    const wasHidden = hidden.has(key);
    setLive(`${key} ${wasHidden ? "gösteriliyor" : "gizlendi"}`);
  }

  const ease = { duration: reduce ? 0 : 0.35, ease: EASE };

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Dönem</th>
              {series.map((s) => (
                <th key={s.label} scope="col">
                  {s.label}
                </th>
              ))}
              {target ? <th scope="col">{target.label ?? "Hedef"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label + i}>
                <th scope="row">{label}</th>
                {series.map((s) => (
                  <td key={s.label}>{fmt(s.values[i] ?? 0)}</td>
                ))}
                {target ? <td>{fmt(target.value)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showToggles && series.length > 1 ? (
        <SeriesToggles
          className="mb-4"
          label="Gösterilen seriler"
          items={series.map((s, i) => ({ key: s.label, label: s.label, series: (tone(s, i) + 1) as Series, dashed: s.dashed }))}
          hidden={hidden}
          onToggle={toggle}
        />
      ) : null}

      <div className="flex gap-2">
        <div aria-hidden className={cn("relative w-9 shrink-0 text-micro text-muted tabular-nums", height)}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${hPct(t)}%` }}>
              {compact.format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            aria-label={`${title}: ok tuşlarıyla noktalar arasında gezin`}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerMove={(e) => n && setActive(nearest(e))}
            onPointerDown={(e) => n && setActive(nearest(e))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            className={cn("relative touch-pan-y rounded-sm select-none", height)}
          >
            <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              <defs>
                <clipPath id={clip}>
                  <m.rect
                    x={-8}
                    y={-8}
                    width={W + 16}
                    height={H + 16}
                    style={{ originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={seen ? { scaleX: 1 } : undefined}
                    transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
                  />
                </clipPath>
              </defs>
              {ticks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={W}
                  y1={y(t)}
                  y2={y(t)}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                  vectorEffect="non-scaling-stroke"
                  className={t === 0 ? "stroke-line" : "stroke-line-soft"}
                />
              ))}
              <g clipPath={`url(#${clip})`}>
                {/* Ters sıra: ilk seri en üstte çizilir */}
                {[...series].reverse().map((s, ri) => {
                  const si = series.length - 1 - ri;
                  const off = hidden.has(s.label);
                  const d = monotonePath(s.values.map((v, i) => [x(i), y(v)] as const));
                  return (
                    <m.path
                      key={s.label}
                      initial={false}
                      animate={{ d, opacity: off ? 0 : 1 }}
                      transition={ease}
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray={s.dashed ? "6 5" : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className={cn(STROKE[tone(s, si)], active !== null && "opacity-90")}
                    />
                  );
                })}
              </g>
              {target ? (
                <m.line
                  x1={0}
                  x2={W}
                  initial={false}
                  animate={{ y1: y(target.value), y2: y(target.value) }}
                  transition={ease}
                  strokeDasharray="2 4"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-line-strong"
                />
              ) : null}
            </svg>

            {/* Veri noktası halkaları: HTML, esnemede yuvarlak kalsın */}
            {markers && seen
              ? shown.map(({ s, i: si }) =>
                  s.values.map((v, i) => (
                    <span
                      key={`${s.label}-${i}`}
                      aria-hidden
                      className="pointer-events-none absolute top-0 h-full w-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
                      style={{ left: `${pct(i)}%`, transform: `translateY(${100 - hPct(v)}%)` }}
                    >
                      <span
                        className={cn(
                          "absolute top-0 left-0 size-2 -translate-1/2 rounded-full border-2 bg-overlay",
                          ["border-chart-1", "border-chart-2", "border-chart-3", "border-chart-4", "border-chart-5", "border-chart-6"][tone(s, si)],
                        )}
                      />
                    </span>
                  )),
                )
              : null}

            {target ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `translateY(${100 - hPct(target.value)}%)` }}
              >
                <span className="absolute top-0 right-0 -translate-y-1/2 rounded-full border border-line bg-overlay px-2 py-0.5 text-micro font-medium whitespace-nowrap text-body shadow-raised">
                  {target.label ?? "Hedef"} {compact.format(target.value)}
                </span>
              </span>
            ) : null}

            {n === 0 ? (
              <p className="absolute inset-0 grid place-items-center text-small text-muted">Bu dönem için veri yok</p>
            ) : null}

            {active !== null && n > 0 ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-transform duration-150 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(${pct(active)}%)` }}
              >
                <span className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-line-strong" />
                {shown.map(({ s, i: si }) => {
                  const v = s.values[active] ?? 0;
                  return (
                    <span key={s.label} className="absolute top-0 left-0 h-full w-0" style={{ transform: `translateY(${100 - hPct(v)}%)` }}>
                      <span className={cn("absolute top-0 left-0 size-2.5 -translate-1/2 rounded-full ring-2 ring-overlay", SERIES_BG[tone(s, si)])} />
                    </span>
                  );
                })}
                <div
                  className={cn(
                    "absolute top-1 left-0 min-w-36 rounded-md bg-overlay px-2.5 py-2 shadow-floating",
                    pct(active) > 58 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5",
                  )}
                >
                  <p className="text-micro text-muted">{labels[active]}</p>
                  <ul className="mt-1 space-y-0.5">
                    {rowsAt(active).map(({ s, si, v }) => (
                      <li key={s.label} className="flex items-center gap-1.5 text-small whitespace-nowrap">
                        <span className={cn("size-2 shrink-0 rounded-[3px]", SERIES_BG[tone(s, si)])} />
                        <span className="text-muted">{s.label}</span>
                        <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{fmt(v)}</span>
                      </li>
                    ))}
                  </ul>
                  {target ? (
                    <p className="mt-1.5 flex items-center gap-1.5 border-t border-line-soft pt-1.5 text-small whitespace-nowrap">
                      <span className="h-0 w-2 shrink-0 border-t border-dashed border-line-strong" />
                      <span className="text-muted">{target.label ?? "Hedef"}</span>
                      <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{fmt(target.value)}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div aria-hidden className="relative mt-2 h-4 text-micro text-muted">
            {labels.map((label, i) => (
              <span
                key={label + i}
                className={cn(
                  "absolute top-0 whitespace-nowrap",
                  i === 0 ? "left-0" : i === n - 1 ? "right-0" : "-translate-x-1/2",
                  !showTick(i, stepSm) && "max-sm:hidden",
                  !showTick(i, stepLg) && "sm:hidden",
                )}
                style={i === 0 || i === n - 1 ? undefined : { left: `${pct(i)}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </figure>
  );
}
