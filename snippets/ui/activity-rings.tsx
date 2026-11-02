"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";

/**
 * Aktivite halkaları: her ölçü KENDİ HEDEFİNE göre bir tam tur (günlük
 * adım, haftalık satış kotası, sprint puanı). Halka %100'de kapanır; aşılırsa
 * ikinci tur aynı izin üstünden devam eder. Ölçülerin birbirine oranı
 * okunacaksa bu değil: `ring-chart.tsx` (en büyüğe göre ölçekli yaylar).
 *
 * İKİNCİ TUR "KESİKLE" GÖRÜNÜR: aşan kısım, altında zemin renginde
 * (`stroke-surface`) biraz daha kalın bir yayla çizilir; ilk turun üstüne
 * bindiği uçta ince bir boşluk oluşur ve göz "üst üste bindi" diye okur.
 * Gölge ya da koyu ton kullanmıyoruz: pastel paletin üstünde koyu ton palete
 * yabancı, gölge ise iki temada farklı davranıyor. 2 turdan fazlası çizilmez
 * (yüzde metinde doğru yazılır: "%240").
 *
 * Yay `pathLength` ile çizilir: viewBox kare, esnemiyor, `pathLength`
 * güvenli (esneyen grafiklerin kırpma perdesi burada gerekmez). Ekrana
 * girince içten dışa sırayla, hareket azaltmada son hal anında. Hedefi 0
 * olan ölçü boş iz olarak kalır.
 *
 * Ortadaki alan `children` (yoksa ortalama tamamlanma). Yanında, halkaları
 * metne çeviren bir liste: her satır "Hareket · 480 / 600 kcal · %80".
 * Erişilebilirlik: çizim `aria-hidden`; aynı bilgi listede gerçek metin.
 * `layout="stack"` listeyi alta, `"row"` yana koyar (`sm` üstü).
 */

export type ActivityRing = {
  /** "Hareket" */
  label: string;
  value: number;
  goal: number;
  /** "kcal", "dk" */
  unit?: string;
  series: Series;
};

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const number = new Intl.NumberFormat("tr-TR");
const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });

export function ActivityRings({
  rings,
  title,
  thickness = 14,
  gap = 4,
  layout = "row",
  showList = true,
  cut = "stroke-surface",
  children,
  className,
}: {
  /** Dıştan içe; 1-4 halka. */
  rings: readonly ActivityRing[];
  /** Listenin ve çizimin adı: "Bugünkü Hedefler". */
  title: string;
  /** Halka kalınlığı ve aralığı, viewBox birimi (200 üzerinden). */
  thickness?: number;
  gap?: number;
  layout?: "row" | "stack";
  showList?: boolean;
  /** İkinci tur kesiğinin rengi = halkanın durduğu zemin. `ChartCard` içinde `stroke-surface`, karo üstünde `stroke-overlay`. */
  cut?: string;
  /** Ortadaki özet; yoksa ortalama tamamlanma. */
  children?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.4 }) || reduce === true;
  const ratio = (r: ActivityRing) => (r.goal > 0 ? Math.max(0, r.value / r.goal) : 0);
  const outer = 100 - thickness / 2 - 2;
  const mean = rings.length ? rings.reduce((sum, r) => sum + Math.min(ratio(r), 1), 0) / rings.length : 0;
  const draw = (i: number, extra = 0) => ({ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.1 + i * 0.12 + extra, ease: EASE });

  return (
    <div ref={box} className={cn("flex flex-col items-center gap-6", layout === "row" && "sm:flex-row sm:gap-8", className)}>
      <div className="relative aspect-square w-full max-w-56 shrink-0">
        {/* Liste yoksa çizim kendi adını taşır; varsa aynı bilgi listede, çizim susar. */}
        <svg
          aria-hidden={showList || undefined}
          role={showList ? undefined : "img"}
          aria-label={showList ? undefined : `${title}: ${rings.map((r) => `${r.label} ${percent.format(ratio(r))}`).join(", ")}`}
          viewBox="0 0 200 200"
          className="size-full -rotate-90"
        >
          {rings.map((ring, i) => {
            const r = outer - i * (thickness + gap);
            if (r <= thickness) return null;
            const p = ratio(ring);
            const first = Math.min(p, 1);
            const second = Math.min(Math.max(p - 1, 0), 1);
            const tone = STROKE[ring.series - 1];
            return (
              <g key={ring.label}>
                <circle cx="100" cy="100" r={r} fill="none" strokeWidth={thickness} className="stroke-chart-track" />
                {first > 0 ? (
                  <m.circle
                    cx="100"
                    cy="100"
                    r={r}
                    fill="none"
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    className={tone}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={seen ? { pathLength: first, opacity: 1 } : undefined}
                    transition={draw(i)}
                  />
                ) : null}
                {second > 0 ? (
                  <>
                    {/* Kesik: zemin renginde, biraz kalın; uçta boşluk bırakır */}
                    <m.circle
                      cx="100"
                      cy="100"
                      r={r}
                      fill="none"
                      strokeWidth={thickness + 3}
                      strokeLinecap="round"
                      className={cut}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={seen ? { pathLength: second, opacity: 1 } : undefined}
                      transition={draw(i, reduce ? 0 : 1)}
                    />
                    <m.circle
                      cx="100"
                      cy="100"
                      r={r}
                      fill="none"
                      strokeWidth={thickness}
                      strokeLinecap="round"
                      className={tone}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={seen ? { pathLength: second, opacity: 1 } : undefined}
                      transition={draw(i, reduce ? 0 : 1)}
                    />
                  </>
                ) : null}
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          {children ?? (
            <div>
              <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">{percent.format(mean)}</p>
              <p className="text-micro text-muted">Ortalama</p>
            </div>
          )}
        </div>
      </div>

      {showList ? (
        <ul aria-label={title} className="grid w-full min-w-0 gap-1.5">
          {rings.map((ring) => {
            const p = ratio(ring);
            const done = p >= 1;
            return (
              <li key={ring.label} className="flex items-center gap-3 rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
                <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", SERIES_BG[ring.series - 1])} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-muted">{ring.label}</span>
                  <span className="block text-base font-semibold text-strong tabular-nums">
                    {number.format(ring.value)}
                    <span className="font-medium text-muted">
                      {" "}
                      / {number.format(ring.goal)}
                      {ring.unit ? ` ${ring.unit}` : ""}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-sm px-1.5 py-0.5 text-small font-semibold tabular-nums",
                    done ? "bg-success-wash text-success" : "bg-surface-raised text-body",
                  )}
                >
                  {percent.format(p)}
                  {done ? <span className="sr-only">, hedef tamamlandı</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
