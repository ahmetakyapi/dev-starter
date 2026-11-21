"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { monotonePath } from "@/components/ui/area-chart";

/**
 * Tahmin grafiği: "şimdiye kadar ne oldu, bu gidişle nereye varırız, şunları
 * yaparsak nereye varırız" (marj, ciro, kapasite, bütçe). Bir hikâye anlatır:
 * GERÇEKLEŞEN çizgi (dolu nokta) bugünden itibaren ikiye ayrılır: MEVCUT YOL
 * (içi boş nokta) ve DEĞİŞİKLİKLERLE yol (yeşil, dolu nokta); arkada tek bir
 * OLASI ARALIK bandı mevcut yolun belirsizliğini söyler, hedef çizgisi ölçüttür.
 *
 * `line-chart.tsx` ile farkı: o, aynı eksendeki 2-5 seriyi KIYASLAR (hepsi
 * ölçülmüş ya da hepsi tahmin). Bu, tek bir ölçünün geçmişinden iki geleceği
 * ve belirsizliğini çizer; seri filtresi yok, bunun yerine `withChanges`
 * verilmezse (anahtarlar kapalıyken) yeşil yol çizilmez: `lever-card.tsx`
 * anahtarlarına bağlı kullanım budur. Y ekseni SIFIRDAN başlamaz (marj %30-40
 * arasında oynar; sıfırdan başlayan eksen farkı ezer); eksen verinin,
 * bandın ve hedefin tamamını kapsar.
 *
 * VERİ: hepsi `labels` ile aynı uzunlukta, boş değer `null`. `actual` sonu
 * `actualUntil`a (varsayılan son dolu indeks) kadar dolu; `current` ve
 * `withChanges` o indeksten sonrasını taşır. İki yol son gerçek değerden
 * başlar: kendi değeri o indekste boşsa grafik gerçek değeri ödünç alır,
 * çizgi kopmaz. Aralık `low` ve `high` birlikte dolu olan noktalarda çizilir.
 *
 * ÇİZGİ BİÇİMİ İKİ İŞARET: renk ve nokta. Gerçekleşen dolu mavi nokta,
 * mevcut yol içi boş mavi halka, değişikliklerle yeşil dolu nokta; ayrıca
 * mevcut yol kesik çizgi. İlk çizim kırpma perdesiyle soldan (`scaleX`,
 * `line-chart.tsx` ile aynı); hareket azaltmada son halinde.
 *
 * Etkileşim: fare/dokunma (`touch-pan-y`) ve klavye (odaklan, ← → Home End,
 * Escape). Balon o aydaki bütün değerleri sayar; klavyeyle seçilen nokta
 * canlı bölgede okunur; asıl veri `sr-only` tabloda. Hiç değer yoksa
 * "Bu dönem için veri yok"; tek noktada yatayda ortalanır.
 *
 *   <ForecastChart
 *     title="Marj Görünümü"
 *     labels={["Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]}
 *     actual={[32.8, 33.5, 34.4, 35.1, 34.9, 35.2, null, null, null]}
 *     current={[null, null, null, null, null, 35.2, 35.6, 35.9, 36.1]}
 *     withChanges={on ? [null, null, null, null, null, 35.2, 36.8, 37.2, 37.6] : undefined}
 *     range={{ low: [...], high: [...] }}
 *     target={{ value: 38, label: "Hedef" }}
 *     format={(v) => `%${v.toFixed(1).replace(".", ",")}`}
 *   />
 */

export type ForecastValues = readonly (number | null)[];

type ForecastChartProps = {
  title: string;
  /** X ekseni etiketleri, kısa: "Nis", "12 Eki". Bütün serilerle aynı uzunlukta. */
  labels: readonly string[];
  actual: ForecastValues;
  current: ForecastValues;
  /** Verilmezse yeşil yol ve lejant öğesi gizlenir. */
  withChanges?: ForecastValues;
  /** Mevcut yolun olası aralığı; `low` ve `high` birlikte dolu noktalarda bant çizilir. */
  range?: { low: ForecastValues; high: ForecastValues };
  target?: { value: number; label?: string };
  /** Değer biçimi (eksen, balon, tablo): `(v) => "%" + v.toFixed(1)`. */
  format?: (value: number) => string;
  /** Son gerçek değerin indeksi; verilmezse `actual`ın son dolu indeksi. */
  actualUntil?: number;
  /** Lejant ve balon adları. */
  names?: { actual?: string; current?: string; withChanges?: string; range?: string };
  height?: string;
  className?: string;
};

const W = 600;
const H = 200;
const EASE = [0.22, 1, 0.36, 1] as const;
type Point = readonly [number, number];

/** Eksen verinin tamamını kapsar ve sıfırdan başlamaz; adım yuvarlak. */
function niceScale(min: number, max: number, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { lo: 0, hi: 1, ticks: [0, 1] };
  const span = max - min || Math.abs(max) * 0.1 || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * pow >= raw) ?? 10) * pow;
  const lo = Math.floor(min / step) * step;
  let hi = Math.ceil(max / step) * step;
  if (hi === lo) hi += step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Math.round((lo + i * step) * 1e6) / 1e6);
  return { lo, hi, ticks };
}

const finite = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export function ForecastChart({
  title,
  labels,
  actual,
  current,
  withChanges,
  range,
  target,
  format = (v) => v.toLocaleString("tr-TR"),
  actualUntil,
  names,
  height = "h-64",
  className,
}: ForecastChartProps) {
  const clip = `fc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotion();
  const frame = useRef<HTMLElement>(null);
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const [active, setActive] = useState<number | null>(null);
  const [live, setLive] = useState("");

  const n = labels.length;
  const name = {
    actual: names?.actual ?? "Gerçekleşen",
    current: names?.current ?? "Mevcut Yol",
    withChanges: names?.withChanges ?? "Değişikliklerle",
    range: names?.range ?? "Olası Aralık",
  };
  const lastActual = (() => {
    for (let i = Math.min(actual.length, n) - 1; i >= 0; i--) if (finite(actual[i])) return i;
    return -1;
  })();
  const au = Math.min(n - 1, actualUntil ?? lastActual);

  /** Yol son gerçek değerden başlar: kendi değeri boşsa gerçeği ödünç al. */
  const joined = (values: ForecastValues | undefined): (number | null)[] | null =>
    values ? Array.from({ length: n }, (_, i) => (i < au ? null : i === au ? (finite(values[i]) ? values[i] : (actual[i] ?? null)) : (values[i] ?? null))) : null;
  const act = Array.from({ length: n }, (_, i) => (i <= au && finite(actual[i]) ? actual[i] : null));
  const cur = joined(current) ?? [];
  const chg = joined(withChanges);
  const lowHigh = range
    ? Array.from({ length: n }, (_, i) => (finite(range.low[i]) && finite(range.high[i]) ? ([range.low[i] as number, range.high[i] as number] as const) : null))
    : null;

  const all = [...act, ...cur, ...(chg ?? []), ...(lowHigh ?? []).flatMap((p) => (p ? [p[0], p[1]] : [])), target?.value].filter(finite);
  const { lo, hi, ticks } = niceScale(all.length ? Math.min(...all) : 0, all.length ? Math.max(...all) : 1);
  const x = (i: number) => (n < 2 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const pct = (i: number) => (n < 2 ? 50 : (i / (n - 1)) * 100);
  const hPct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  const pathOf = (values: readonly (number | null)[]) => {
    const pts: Point[] = [];
    values.forEach((v, i) => finite(v) && pts.push([x(i), y(v)]));
    return pts.length ? monotonePath(pts) : "";
  };
  const bandPath = (() => {
    if (!lowHigh) return "";
    const idx = lowHigh.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 2) return "";
    const low = idx.map((i) => [x(i), y(lowHigh[i]![0])] as Point);
    const high = idx.map((i) => [x(i), y(lowHigh[i]![1])] as Point).reverse();
    return `${monotonePath(low)}${monotonePath(high).replace(/^M/, "L")}Z`;
  })();

  const stepSm = Math.max(1, Math.ceil(n / 6));
  const showTick = (i: number) => i === n - 1 || (i % stepSm === 0 && n - 1 - i >= stepSm);

  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    return Math.round(ratio * (n - 1));
  };

  type Row = { key: string; label: string; text: string; tone: "actual" | "current" | "changes" | "range" };
  const rowsAt = (i: number): Row[] => {
    const rows: Row[] = [];
    if (finite(act[i])) rows.push({ key: "a", label: name.actual, text: format(act[i] as number), tone: "actual" });
    if (i > au && finite(cur[i])) rows.push({ key: "c", label: name.current, text: format(cur[i] as number), tone: "current" });
    if (chg && i > au && finite(chg[i])) rows.push({ key: "w", label: name.withChanges, text: format(chg[i] as number), tone: "changes" });
    const band = lowHigh?.[i];
    if (band && i > au) rows.push({ key: "r", label: name.range, text: `${format(band[0])} – ${format(band[1])}`, tone: "range" });
    return rows;
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
    setLive(`${labels[next]}: ${rowsAt(next).map((r) => `${r.label} ${r.text}`).join(", ")}`);
  }

  const dot = {
    actual: "bg-chart-2",
    current: "border-2 border-chart-2 bg-overlay",
    changes: "bg-success",
    range: "bg-chart-2/20",
  } as const;
  const empty = n === 0 || all.length === 0;
  const ease = { duration: reduce ? 0 : 0.35, ease: EASE };

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Dönem</th>
              <th scope="col">{name.actual}</th>
              <th scope="col">{name.current}</th>
              {chg ? <th scope="col">{name.withChanges}</th> : null}
              {lowHigh ? <th scope="col">{name.range}</th> : null}
              {target ? <th scope="col">{target.label ?? "Hedef"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label + i}>
                <th scope="row">{label}</th>
                <td>{finite(act[i]) ? format(act[i] as number) : "—"}</td>
                <td>{i > au && finite(cur[i]) ? format(cur[i] as number) : "—"}</td>
                {chg ? <td>{i > au && finite(chg[i]) ? format(chg[i] as number) : "—"}</td> : null}
                {lowHigh ? <td>{lowHigh[i] && i > au ? `${format(lowHigh[i]![0])} – ${format(lowHigh[i]![1])}` : "—"}</td> : null}
                {target ? <td>{format(target.value)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul role="list" aria-hidden className="mb-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 text-small text-body">
        {(
          [
            ["actual", name.actual, true],
            ["current", name.current, true],
            ["changes", name.withChanges, Boolean(chg)],
            ["range", name.range, Boolean(lowHigh)],
          ] as const
        )
          .filter(([, , on]) => on)
          .map(([tone, label]) => (
            <li key={tone} className="flex items-center gap-1.5">
              {tone === "range" ? (
                <span className="h-2.5 w-4 rounded-[3px] bg-chart-2/20" />
              ) : (
                <span className="flex items-center gap-0.5">
                  <span className={cn("h-0.5 w-3 rounded-full", tone === "changes" ? "bg-success" : "bg-chart-2")} />
                  <span className={cn("size-2 rounded-full", dot[tone])} />
                </span>
              )}
              {label}
            </li>
          ))}
      </ul>

      <div className="flex gap-2">
        <div aria-hidden className={cn("relative w-10 shrink-0 text-micro text-muted tabular-nums", height)}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${hPct(t)}%` }}>
              {format(t)}
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
                <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} strokeDasharray={t === lo ? undefined : "3 4"} vectorEffect="non-scaling-stroke" className={t === lo ? "stroke-line" : "stroke-line-soft"} />
              ))}
              {au >= 0 && au < n - 1 ? <line x1={x(au)} x2={x(au)} y1={0} y2={H} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" className="stroke-line-strong" /> : null}
              <g clipPath={`url(#${clip})`}>
                {bandPath ? <m.path initial={false} animate={{ d: bandPath }} transition={ease} className="fill-chart-2/15" /> : null}
                <m.path initial={false} animate={{ d: pathOf(act) }} transition={ease} fill="none" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-2" />
                <m.path initial={false} animate={{ d: pathOf(cur) }} transition={ease} fill="none" strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-2" />
                {chg ? <m.path initial={false} animate={{ d: pathOf(chg) }} transition={ease} fill="none" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-success" /> : null}
              </g>
              {target ? <line x1={0} x2={W} y1={y(target.value)} y2={y(target.value)} strokeDasharray="2 4" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="stroke-line-strong" /> : null}
            </svg>

            {/* Veri noktaları: HTML, esnemede yuvarlak kalsın */}
            {seen
              ? ([
                  ["actual", act, 0],
                  ["current", cur, au + 1],
                  ["changes", chg ?? [], au + 1],
                ] as const).map(([tone, values, from]) =>
                  values.map((v, i) =>
                    finite(v) && i >= from ? (
                      <span key={`${tone}-${i}`} aria-hidden className="pointer-events-none absolute top-0 h-full w-0" style={{ left: `${pct(i)}%`, transform: `translateY(${100 - hPct(v)}%)` }}>
                        <span className={cn("absolute top-0 left-0 size-2.5 -translate-1/2 rounded-full", dot[tone as "actual" | "current" | "changes"])} />
                      </span>
                    ) : null,
                  ),
                )
              : null}

            {target ? (
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ transform: `translateY(${100 - hPct(target.value)}%)` }}>
                <span className="absolute top-0 left-0 -translate-y-1/2 rounded-full border border-line bg-overlay px-2 py-0.5 text-micro font-medium whitespace-nowrap text-body shadow-raised">
                  {target.label ?? "Hedef"} {format(target.value)}
                </span>
              </span>
            ) : null}

            {empty ? <p className="absolute inset-0 grid place-items-center text-small text-muted">Bu dönem için veri yok</p> : null}

            {active !== null && !empty ? (
              <div aria-hidden className="pointer-events-none absolute inset-0 transition-transform duration-150 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${pct(active)}%)` }}>
                <span className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-line-strong" />
                <div className={cn("absolute top-1 left-0 min-w-40 rounded-md bg-overlay px-2.5 py-2 shadow-floating", pct(active) > 58 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5")}>
                  <p className="text-micro text-muted">{labels[active]}</p>
                  <ul role="list" className="mt-1 space-y-0.5">
                    {rowsAt(active).map((row) => (
                      <li key={row.key} className="flex items-center gap-1.5 text-small whitespace-nowrap">
                        <span className={cn("size-2 shrink-0 rounded-full", dot[row.tone])} />
                        <span className="text-muted">{row.label}</span>
                        <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{row.text}</span>
                      </li>
                    ))}
                  </ul>
                  {target ? (
                    <p className="mt-1.5 flex items-center gap-1.5 border-t border-line-soft pt-1.5 text-small whitespace-nowrap">
                      <span className="h-0 w-2 shrink-0 border-t border-dashed border-line-strong" />
                      <span className="text-muted">{target.label ?? "Hedef"}</span>
                      <span className="ml-auto pl-3 font-semibold text-strong tabular-nums">{format(target.value)}</span>
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
                className={cn("absolute whitespace-nowrap", i === n - 1 ? "right-0" : "-translate-x-1/2", !showTick(i) && "hidden", i === au && "font-medium text-strong")}
                style={i === n - 1 ? undefined : { left: `${pct(i)}%` }}
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
