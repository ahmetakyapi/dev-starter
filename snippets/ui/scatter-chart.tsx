"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";
import { SeriesToggles } from "@/components/ui/line-chart";

/**
 * Saçılım grafiği: iki ölçü arasındaki İLİŞKİYİ göstermek için (harcama ↔
 * dönüşüm, fiyat ↔ satış). Nokta boyu isteğe bağlı üçüncü ölçü (tıklama,
 * stok), rengi kategori. Zaman ekseni varsa bu değil, `line-chart.tsx`.
 *
 * BOY ALANLA ÖLÇEKLENİR, YARIÇAPLA DEĞİL: göz alanı okur; iki kat değer iki
 * kat alan (√ ölçek). Yarıçap doğrusal büyürse büyük değer abartılır. En
 * küçük nokta bile dokunmada görünür kalsın diye 8, kalabalık olmasın diye
 * en çok 32 piksel.
 *
 * NOKTALAR HTML, IZGARA SVG: noktalar esneyen viewBox'ta elipse dönerdi.
 * Yarı saydam (%70) ve ince bir halkayla: üst üste binen noktalar
 * birbirini yutmaz, yığılma koyuluktan okunur.
 *
 * İMLEÇTE EN YAKIN NOKTA: fare/parmak konumuna EKRAN PİKSELİNDE en yakın
 * nokta seçilir (eksenlerin birimi farklı; veri biriminde uzaklık anlamsız).
 * Seçilen nokta büyür, diğerleri sönükleşir, balon üç ölçüyü ve kategoriyi
 * söyler. Klavyede noktalar X sırasıyla gezilir (← →, Home End), seçim canlı
 * bölgede okunur.
 *
 * Kategori anahtarı aynı zamanda süzgeç (`SeriesToggles`, line-chart.tsx);
 * eksen gizli kategoriyle yeniden ölçeklenmez: saçılımda konum karşılaştırma
 * içindir, kayan eksen yanıltır. Veri `sr-only` tabloda.
 *
 * Hareket: ekrana girince noktalar 0,85 ölçekten soldan sağa sırayla belirir
 * (0'dan değil). Hareket azaltmada hepsi yerinde.
 */

export type ScatterPoint = {
  /** Balon ve tablo adı: "Kış İndirimi". */
  label: string;
  x: number;
  y: number;
  /** Üçüncü ölçü (nokta boyu). */
  size?: number;
  /** `categories` içindeki anahtar. */
  category: string;
};

type Axis = { label: string; format?: Intl.NumberFormatOptions; unit?: string };

const RING = ["ring-chart-1", "ring-chart-2", "ring-chart-3", "ring-chart-4", "ring-chart-5", "ring-chart-6"] as const;
const W = 600;
const H = 300;
const EASE = [0.22, 1, 0.36, 1] as const;

/** `min`-`max` aralığını yuvarlak adımlarla kapsar. `zero`: eksen 0'dan başlar. Saf. */
export function niceRange(min: number, max: number, count = 4, zero = true): number[] {
  const lo = zero ? Math.min(0, min) : min;
  const hi = max > lo ? max : lo + 1;
  const raw = (hi - lo) / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * pow >= raw) ?? 10) * pow;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  return Array.from({ length: Math.round((end - start) / step) + 1 }, (_, i) => Math.round((start + i * step) * 1e9) / 1e9);
}

export function ScatterChart({
  points,
  categories,
  x: xAxis,
  y: yAxis,
  size: sizeAxis,
  title,
  zero = true,
  height = "h-72",
  className,
}: {
  points: readonly ScatterPoint[];
  /** Renk ve anahtar: sıra lejant sırası. */
  categories: readonly { key: string; label: string; series: Series }[];
  x: Axis;
  y: Axis;
  /** Nokta boyunun anlamı; yoksa bütün noktalar aynı boyda. */
  size?: Axis;
  title: string;
  /** Eksenler 0'dan başlasın mı (oran ve fiyatta genelde evet). */
  zero?: boolean;
  height?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLElement>(null);
  const seen = useInView(frame, { once: true, amount: 0.25 }) || reduce === true;
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState<number | null>(null);
  const [live, setLive] = useState("");

  const f = (a: Axis, compact = false) =>
    new Intl.NumberFormat("tr-TR", compact ? { ...a.format, notation: "compact", maximumFractionDigits: 1 } : a.format);
  const fx = f(xAxis);
  const fy = f(yAxis);
  const fs = sizeAxis ? f(sizeAxis) : null;
  const cx = f(xAxis, true);
  const cy = f(yAxis, true);
  const show = (a: Axis, nf: Intl.NumberFormat, v: number) => nf.format(v) + (a.unit ? ` ${a.unit}` : "");

  // X sırası: klavye gezinmesi ve beliriş sırası soldan sağa.
  const order = points.map((p, i) => ({ p, i })).sort((a, b) => a.p.x - b.p.x || a.p.y - b.p.y);
  const visible = order.filter(({ p }) => !hidden.has(p.category));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  // 0'ı burada katma: `zero={false}` eksenin veriden başlamasını ister, karar niceRange'te.
  const xt = niceRange(xs.length ? Math.min(...xs) : 0, xs.length ? Math.max(...xs) : 1, 5, zero);
  const yt = niceRange(ys.length ? Math.min(...ys) : 0, ys.length ? Math.max(...ys) : 1, 4, zero);
  const [x0, x1] = [xt[0], xt.at(-1)!];
  const [y0, y1] = [yt[0], yt.at(-1)!];
  const px = (v: number) => ((v - x0) / (x1 - x0)) * 100;
  const py = (v: number) => ((v - y0) / (y1 - y0)) * 100;
  const maxSize = Math.max(...points.map((p) => p.size ?? 0), 1);
  const diameter = (p: ScatterPoint) => (sizeAxis && p.size !== undefined ? 8 + Math.sqrt(p.size / maxSize) * 24 : 12);
  const cat = new Map(categories.map((c) => [c.key, c]));

  const describe = (p: ScatterPoint) =>
    `${p.label} (${cat.get(p.category)?.label ?? p.category}): ${xAxis.label} ${show(xAxis, fx, p.x)}, ${yAxis.label} ${show(yAxis, fy, p.y)}` +
    (sizeAxis && fs && p.size !== undefined ? `, ${sizeAxis.label} ${show(sizeAxis, fs, p.size)}` : "");

  function nearest(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - box.left;
    const my = event.clientY - box.top;
    let best: number | null = null;
    let dist = Infinity;
    for (const { p, i } of visible) {
      const dx = (px(p.x) / 100) * box.width - mx;
      const dy = (1 - py(p.y) / 100) * box.height - my;
      const d = Math.hypot(dx, dy);
      if (d < dist) [best, dist] = [i, d];
    }
    // Uzakta boşluğa gelince seçim yok: 64 piksel ötesi "en yakın" değil.
    return dist <= 64 ? best : null;
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!visible.length) return;
    const pos = visible.findIndex(({ i }) => i === active);
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = pos < 0 ? 0 : Math.min(visible.length - 1, pos + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = pos < 0 ? visible.length - 1 : Math.max(0, pos - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = visible.length - 1;
    else if (event.key === "Escape") return setActive(null);
    if (next === null) return;
    event.preventDefault();
    setActive(visible[next].i);
    setLive(describe(visible[next].p));
  }

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (active !== null && points[active]?.category === key) setActive(null);
  }

  const sel = active !== null ? points[active] : null;

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Ad</th>
              <th scope="col">Kategori</th>
              <th scope="col">{xAxis.label}</th>
              <th scope="col">{yAxis.label}</th>
              {sizeAxis ? <th scope="col">{sizeAxis.label}</th> : null}
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.label + i}>
                <th scope="row">{p.label}</th>
                <td>{cat.get(p.category)?.label ?? p.category}</td>
                <td>{show(xAxis, fx, p.x)}</td>
                <td>{show(yAxis, fy, p.y)}</td>
                {sizeAxis && fs ? <td>{p.size !== undefined ? show(sizeAxis, fs, p.size) : "—"}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length > 1 ? (
        <SeriesToggles
          className="mb-4"
          label="Gösterilen kategoriler"
          items={categories.map((c) => ({ key: c.key, label: c.label, series: c.series }))}
          hidden={hidden}
          onToggle={toggle}
        />
      ) : null}

      <p aria-hidden className="mb-2 text-micro font-medium text-muted">
        {yAxis.label}
        {yAxis.unit ? ` (${yAxis.unit})` : ""}
      </p>
      <div className="flex gap-2">
        <div aria-hidden className={cn("relative w-9 shrink-0 text-micro text-muted tabular-nums", height)}>
          {yt.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${py(t)}%` }}>
              {cy.format(t)}
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
            onPointerMove={(e) => setActive(nearest(e))}
            onPointerDown={(e) => setActive(nearest(e))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            className={cn("relative touch-pan-y rounded-sm select-none", height)}
          >
            <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {yt.map((t) => (
                <line
                  key={`y${t}`}
                  x1={0}
                  x2={W}
                  y1={H - (py(t) / 100) * H}
                  y2={H - (py(t) / 100) * H}
                  strokeDasharray={t === y0 ? undefined : "3 4"}
                  vectorEffect="non-scaling-stroke"
                  className={t === y0 ? "stroke-line" : "stroke-line-soft"}
                />
              ))}
              {xt.map((t) =>
                t === x0 ? null : (
                  <line
                    key={`x${t}`}
                    y1={0}
                    y2={H}
                    x1={(px(t) / 100) * W}
                    x2={(px(t) / 100) * W}
                    strokeDasharray="3 4"
                    vectorEffect="non-scaling-stroke"
                    className="stroke-line-soft"
                  />
                ),
              )}
            </svg>

            {order.map(({ p, i }, rank) => {
              const c = cat.get(p.category);
              const tone = (c?.series ?? 1) - 1;
              const off = hidden.has(p.category);
              const isActive = active === i;
              const d = diameter(p);
              return (
                <m.span
                  key={p.label + i}
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{ left: `${px(p.x)}%`, bottom: `${py(p.y)}%`, zIndex: isActive ? 2 : 1 }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={seen ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.1 + (rank / Math.max(order.length, 1)) * 0.6, ease: EASE }}
                >
                  {/* Giriş hareketi dış kapta; sönme/büyüme içte CSS ile (motion'ın satır içi opaklığı sınıfı ezmesin). */}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 block -translate-x-1/2 translate-y-1/2 rounded-full ring-1 ring-inset transition-[opacity,scale] duration-200 ease-out",
                      SERIES_BG[tone],
                      RING[tone],
                      off ? "opacity-0" : active !== null && !isActive ? "opacity-35" : "opacity-70",
                      isActive && "scale-125 opacity-100 ring-2 ring-overlay",
                    )}
                    style={{ width: d, height: d }}
                  />
                </m.span>
              );
            })}

            {sel && !hidden.has(sel.category) ? (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute z-10 min-w-44 rounded-md bg-overlay px-2.5 py-2 shadow-floating",
                  px(sel.x) > 55 ? "-translate-x-[calc(100%+14px)]" : "translate-x-3.5",
                  py(sel.y) > 60 ? "translate-y-2" : "-translate-y-[calc(100%+8px)]",
                )}
                style={{ left: `${px(sel.x)}%`, top: `${100 - py(sel.y)}%` }}
              >
                <p className="flex items-center gap-1.5 text-small font-semibold whitespace-nowrap text-strong">
                  <span className={cn("size-2 shrink-0 rounded-full", SERIES_BG[(cat.get(sel.category)?.series ?? 1) - 1])} />
                  {sel.label}
                </p>
                <p className="mt-0.5 text-micro text-muted">{cat.get(sel.category)?.label}</p>
                <dl className="mt-1.5 space-y-0.5 text-small">
                  {[
                    [xAxis.label, show(xAxis, fx, sel.x)],
                    [yAxis.label, show(yAxis, fy, sel.y)],
                    ...(sizeAxis && fs && sel.size !== undefined ? [[sizeAxis.label, show(sizeAxis, fs, sel.size)]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 whitespace-nowrap">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-semibold text-strong tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {points.length === 0 ? <p className="absolute inset-0 grid place-items-center text-small text-muted">Gösterilecek nokta yok</p> : null}
          </div>

          <div aria-hidden className="relative mt-2 h-4 text-micro text-muted tabular-nums">
            {xt.map((t, i) => (
              <span
                key={t}
                className={cn("absolute top-0 whitespace-nowrap", i === 0 ? "left-0" : i === xt.length - 1 ? "right-0" : "-translate-x-1/2", i % 2 === 1 && i !== xt.length - 1 && "max-sm:hidden")}
                style={i === 0 || i === xt.length - 1 ? undefined : { left: `${px(t)}%` }}
              >
                {cx.format(t)}
              </span>
            ))}
          </div>
          <p aria-hidden className="mt-2 text-right text-micro font-medium text-muted">
            {xAxis.label}
            {xAxis.unit ? ` (${xAxis.unit})` : ""}
          </p>
        </div>
      </div>

      {sizeAxis ? (
        <p aria-hidden className="mt-3 flex items-center gap-2 text-micro text-muted">
          <span className="inline-flex items-end gap-1">
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-3.5 rounded-full bg-line-strong" />
            <span className="size-5 rounded-full bg-line-strong" />
          </span>
          Nokta boyu: {sizeAxis.label}
        </p>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </figure>
  );
}
