"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Aktivite ızgarası: sütunlar hafta, satırlar gün (Pazartesi başta), her
 * kare o günün yoğunluğu. Katkı, sipariş, giriş gibi GÜNLÜK bir sayının
 * aylar boyunca ritmini göstermek için ("hafta sonları boş", "Mart yoğun").
 * Tek günün kesin değeri balonda; toplam `ChartCard` başlığında.
 *
 * BEŞ BASAMAK, TEK AİLE: boş gün `--chart-track`, dört dolu basamak
 * `--primary`nin `color-mix` basamakları (`bg-primary/25 … /100`). Renk
 * değil açıklık sayar; renk körlüğünde ve gri baskıda sıra korunur. Basamak
 * sınırları verilmezse en büyük değere göre dörde bölünür (`levels`).
 *
 * TARİH UTC'DE HESAPLANIR: "2026-03-29" yerel saatle okunursa yaz saati
 * geçişinde gün kayar ve ızgarada bir kare çiftlenir. Bütün takvim
 * matematiği `heatmapGrid` içinde, saf; bitiş günü VERİDEN gelir, `Date.now`
 * değil: sunucu ve istemci aynı ızgarayı basar.
 *
 * KARE BOYU SABİT (telefonda 12, geniş ekranda 15 px), esnek değil: esnek
 * kare geniş kartta iri bloklara döner. Sığmayan geçmiş yatay kaydırılır ve
 * kap açılışta EN SONA kayar (en yeni hafta görünür); gün etiketleri
 * kaydırmanın dışında, aynı satır şablonuyla hizalı. 26 hafta ~470 px.
 *
 * Hareket: ekrana girince kareler soldan sağa dalga halinde belirir (CSS
 * geçişi, `useInView` ile bir kez); 365 karede 365 motion bileşeni yerine
 * tek gözlemci. Hareketi azaltan kullanıcıda geçiş süresi globals.css'te 0.
 *
 * Etkileşim ve erişilebilirlik: fare/dokunma ile balon; ızgaraya odaklanıp
 * oklarla gün gün gezilir (← → hafta, ↑ ↓ gün), seçilen gün canlı bölgede
 * okunur. Aylık toplamlar `sr-only` tabloda.
 */

type Day = { date: string; value: number };
type Cell = { date: string; value: number; level: 0 | 1 | 2 | 3 | 4; col: number; row: number };

const LEVEL = ["bg-chart-track", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;
const DAY = 86_400_000;
/** Ay satırı + 7 gün; kare boyu `--cell` (telefonda 12, geniş ekranda 15 px). */
const ROWS = "1rem repeat(7, var(--cell))";

const toUTC = (iso: string) => {
  const [y, mo, d] = iso.split("-").map(Number);
  return Date.UTC(y, mo - 1, d);
};
const toISO = (t: number) => new Date(t).toISOString().slice(0, 10);

const monthShort = new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });
const number = new Intl.NumberFormat("tr-TR");

/**
 * Izgarayı kurar: `end` gününü içeren haftada biter, `weeks` hafta geriye
 * gider. Dönen `cells` sütun-satır sırasında; `end`den sonraki günler yok.
 * `months`: ayın ilk gününü içeren sütunlar ve kısa ad ("Mar").
 */
export function heatmapGrid(data: readonly Day[], { end, weeks, levels }: { end?: string; weeks: number; levels?: readonly number[] }) {
  const byDate = new Map(data.map((d) => [d.date, d.value]));
  const last = end ? toUTC(end) : Math.max(...data.map((d) => toUTC(d.date)), 0);
  const row = (t: number) => (new Date(t).getUTCDay() + 6) % 7;
  const start = last - row(last) * DAY - (weeks - 1) * 7 * DAY;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bounds = levels ?? [max * 0.25, max * 0.5, max * 0.75];
  const level = (v: number): Cell["level"] => (v <= 0 ? 0 : v <= bounds[0] ? 1 : v <= bounds[1] ? 2 : v <= bounds[2] ? 3 : 4);

  const cells: Cell[] = [];
  const months: { col: number; label: string }[] = [];
  for (let t = start; t <= last; t += DAY) {
    const i = Math.round((t - start) / DAY);
    const date = toISO(t);
    const value = byDate.get(date) ?? 0;
    const col = Math.floor(i / 7);
    cells.push({ date, value, level: level(value), col, row: i % 7 });
    if (new Date(t).getUTCDate() === 1 || i === 0) {
      // İlk sütun ayın ortasından başlıyorsa ve hemen ardından yeni ay geliyorsa etiketi atla (çakışır).
      if (i === 0 && new Date(t + 14 * DAY).getUTCMonth() !== new Date(t).getUTCMonth()) continue;
      months.push({ col, label: monthShort.format(t).replace(".", "") });
    }
  }
  return { cells, months };
}

export function Heatmap({
  data,
  title,
  weeks = 26,
  end,
  levels,
  unit = "katkı",
  className,
}: {
  /** Günlük değerler, `YYYY-MM-DD`. Eksik gün 0 sayılır. */
  data: readonly Day[];
  /** Grafiğin ve tablonun adı: "Son Altı Ay Katkı". */
  title: string;
  weeks?: number;
  /** Son gün; verilmezse verideki en yeni tarih. */
  end?: string;
  /** Üç sınır: 1-2, 2-3, 3-4. basamak geçişleri (`[2, 5, 9]`). */
  levels?: readonly [number, number, number];
  /** Balondaki birim: "katkı", "sipariş". */
  unit?: string;
  className?: string;
}) {
  const { cells, months } = heatmapGrid(data, { end, weeks, levels });
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Hareket azaltmada görünür olmayı BEKLEME: son hal hemen çizilir. Yoksa
  // ekran dışındaki grafik baskıda, tam sayfa görüntüde ve kaydırmadan önce boş kalır.
  const reduce = useReducedMotion();
  const shown = useInView(scroller, { once: true, amount: 0.3 }) || reduce === true;
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [live, setLive] = useState("");

  // Açılışta en yeni haftayı göster (telefonda geçmiş solda, kaydırılarak).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function place(index: number) {
    const cell = scroller.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    const box = wrap.current?.getBoundingClientRect();
    if (!cell || !box) return;
    const r = cell.getBoundingClientRect();
    setActive(index);
    setTip({ x: r.left + r.width / 2 - box.left, y: r.top - box.top });
  }

  function onPointer(event: PointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (target) place(Number(target.dataset.i));
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 };
    if (event.key === "Escape") return setActive(null);
    let next: number | null = null;
    if (event.key in step) next = Math.min(cells.length - 1, Math.max(0, (active ?? cells.length - 1) + (active === null ? 0 : step[event.key])));
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cells.length - 1;
    if (next === null) return;
    event.preventDefault();
    scroller.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    place(next);
    setLive(`${longDate.format(toUTC(cells[next].date))}: ${number.format(cells[next].value)} ${unit}`);
  }

  const monthTotals = new Map<string, number>();
  for (const c of cells) {
    const key = c.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + c.value);
  }
  const monthAt = new Map(months.map((mo) => [mo.col, mo.label]));
  const current = active !== null ? cells[active] : null;
  const dayLabel = ["Pzt", "", "Çar", "", "Cum", "", ""];

  return (
    <figure ref={wrap} className={cn("relative w-full", className)}>
      <div className="sr-only">
        {/* sr-only kap DIŞTA: <table> width: 1px'i yok sayar, uzun etiketle sayfayı yana taşırır. */}
        <table>
        <caption>{title}: aylık toplam</caption>
        <tbody>
          {[...monthTotals].map(([key, total]) => (
            <tr key={key}>
              <th scope="row">{monthLong.format(toUTC(`${key}-01`))}</th>
              <td>
                {number.format(total)} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex gap-1.5 [--cell:12px] sm:[--cell:15px]">
        {/* Gün etiketleri kaydırmanın DIŞINDA: kare boyu sabit, satırlar aynı şablonla hizalı */}
        <div aria-hidden className="grid shrink-0 gap-[3px] text-micro leading-none text-muted" style={{ gridTemplateRows: ROWS }}>
          <span />
          {dayLabel.map((d, i) => (
            <span key={i} className="flex items-center">
              {d}
            </span>
          ))}
        </div>

        <div
          ref={scroller}
          role="group"
          aria-label={`${title}: oklarla gün gün gezin`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          onPointerOver={onPointer}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain rounded-sm p-0.5 [scrollbar-width:none]"
        >
          <div
            aria-hidden
            className="grid w-max grid-flow-col gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks}, var(--cell))`, gridTemplateRows: ROWS }}
          >
            {Array.from({ length: weeks }, (_, col) => (
              <Week key={col} col={col} label={monthAt.get(col)} cells={cells} active={active} shown={shown} weeks={weeks} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-micro text-muted" aria-hidden>
        <span>Az</span>
        {LEVEL.map((c) => (
          <span key={c} className={cn("size-2.5 rounded-[3px]", c)} />
        ))}
        <span>Çok</span>
      </div>

      {current && tip ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md bg-overlay px-2.5 py-1.5 whitespace-nowrap shadow-floating"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          <p className="text-small font-semibold text-strong tabular-nums">
            {number.format(current.value)} {unit}
          </p>
          <p className="text-micro text-muted">{longDate.format(toUTC(current.date))}</p>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </figure>
  );
}

/** Bir hafta sütunu: üstte ay etiketi (varsa), altında 7 gün. */
function Week({
  col,
  label,
  cells,
  active,
  shown,
  weeks,
}: {
  col: number;
  label?: string;
  cells: readonly Cell[];
  active: number | null;
  shown: boolean;
  weeks: number;
}) {
  const delay = `${Math.round((col / weeks) * 520)}ms`;
  return (
    <>
      <span className="relative min-w-0">
        {label ? <span className="absolute bottom-1 left-0 text-micro leading-none whitespace-nowrap text-muted">{label}</span> : null}
      </span>
      {Array.from({ length: 7 }, (_, row) => {
        const i = col * 7 + row;
        const cell = cells[i];
        if (!cell) return <span key={row} />;
        return (
          <span
            key={row}
            data-i={i}
            className={cn(
              "rounded-[3px] transition-[opacity,transform] duration-300 ease-out",
              LEVEL[cell.level],
              shown ? "scale-100 opacity-100" : "scale-[0.85] opacity-0",
              active === i && "ring-2 ring-strong ring-offset-1 ring-offset-surface",
            )}
            style={{ transitionDelay: shown ? delay : "0ms" }}
          />
        );
      })}
    </>
  );
}
