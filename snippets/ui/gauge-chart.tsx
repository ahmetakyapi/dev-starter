"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Series } from "@/components/ui/chart-card";

/**
 * Yarım daire gösterge: bir bütünün 2-4 parçası ("Masaüstü %47 · Mobil %38
 * · Tablet %15") ya da tek bir doluluk ("Kota %72"), kalın, uçları yuvarlak
 * ve aralarında boşluk olan YAY PARÇALARI; ortada büyük yüzde + etiket.
 * Panonun üst sırasında tek bakışta okunacak bir pay için. Beşten fazla
 * parça ya da kesin kıyas gerekiyorsa `stage-bars.tsx` (uzunluk açıdan iyi
 * okunur).
 *
 * BOŞLUK UÇLARIN İÇİNDEN HESAPLANIR: yuvarlak uç yayı kalınlığının yarısı
 * kadar uzatır. Uç payı (`thickness / 2 / r` radyan) her parçanın iki
 * ucundan düşülmezse parçalar birbirine değer ve "boşluk" yalnızca kâğıtta
 * kalır. Hesap `gaugeSegments` içinde, saf ve test edilebilir.
 *
 * `max` verilir ve parçaların toplamı ondan küçükse kalan kısım İZ
 * (`--chart-track`) olarak çizilir: tek parçalı doluluk göstergesi budur.
 *
 * Ortadaki sayı `highlight` parçasının payı (varsayılan ilk parça); yüzde
 * işareti Türkçede öne gelir: "%47". `children` verilirse onu basar.
 *
 * Hareket: ekrana girince parçalar soldan sağa sırayla çizilir
 * (`pathLength`); hareketi azaltan kullanıcıda süre 0. Fareyle bir parçanın
 * üstüne gelince diğerleri geri çekilir (CSS `:has`).
 *
 * Erişilebilirlik: `role="img"` ve bütün parçaları sayan bir ad; renklerin
 * açıklaması için altına `ChartLegend` (chart-card.tsx) koy.
 */

type Part = { label: string; value: number; series: Series };

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

const CX = 100;
const CY = 100;

/** Merkezi (cx, cy), yarıçapı r olan yay; açı radyan, saat yönünde (ekran koordinatı). */
export function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const f = (v: number) => Math.round(v * 100) / 100;
  const sx = cx + r * Math.cos(start);
  const sy = cy + r * Math.sin(start);
  const ex = cx + r * Math.cos(end);
  const ey = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${f(sx)},${f(sy)}A${r},${r},0,${large},1,${f(ex)},${f(ey)}`;
}

/**
 * Yarım daireyi (π → 2π) değerlere böler. `gap` parçalar arasındaki görünür
 * boşluk, `cap` yuvarlak ucun açısal payı; ikisi de radyan. Dönen açılar
 * ÇİZİLECEK yolun uçlarıdır (uç payı içeride).
 */
export function gaugeSegments(values: readonly number[], { max, gap, cap }: { max: number; gap: number; cap: number }) {
  const total = values.reduce((a, b) => a + b, 0);
  const whole = Math.max(max, total) || 1;
  const parts = total < whole ? [...values, whole - total] : [...values];
  const count = parts.filter((v) => v > 0).length;
  const usable = Math.PI - gap * Math.max(0, count - 1);
  let cursor = Math.PI;
  return parts.map((v) => {
    if (v <= 0) return { start: cursor, end: cursor, share: 0 };
    const span = (v / whole) * usable;
    const start = cursor + cap;
    // Parça uç payından kısaysa nokta olarak çizilir (yol uzunluğu ~0).
    const end = Math.max(start + 0.0001, cursor + span - cap);
    cursor += span + gap;
    return { start, end, share: v / whole };
  });
}

export function GaugeChart({
  parts,
  title,
  max,
  highlight = 0,
  label,
  thickness = 18,
  gap = 7,
  children,
  className,
}: {
  parts: readonly Part[];
  /** Ekran okuyucu adı: "Cihaza Göre Ziyaret". */
  title: string;
  /** Bütün; parçaların toplamından büyükse kalan iz olur. */
  max?: number;
  /** Ortada payı yazılacak parçanın sırası. */
  highlight?: number;
  /** Ortadaki etiket; verilmezse vurgulanan parçanın adı. */
  label?: ReactNode;
  /** Yay kalınlığı ve parçalar arası boşluk, viewBox birimi (200 genişlik üzerinden). */
  thickness?: number;
  gap?: number;
  children?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const r = 100 - thickness / 2 - 2;
  const segments = gaugeSegments(
    parts.map((p) => p.value),
    { max: max ?? 0, gap: gap / r, cap: thickness / 2 / r },
  );
  const focus = parts[highlight];
  const share = segments[highlight]?.share ?? 0;
  const summary = parts.map((p, i) => `${p.label} %${Math.round((segments[i]?.share ?? 0) * 100)}`).join(", ");

  return (
    <div className={cn("relative mx-auto w-full max-w-72", className)}>
      <svg viewBox="0 0 200 110" role="img" aria-label={`${title}: ${summary}`} className="group/gauge block w-full overflow-visible">
        {segments.map((seg, i) => {
          const part = parts[i];
          const track = !part;
          if (seg.share === 0) return null;
          return (
            <m.path
              key={i}
              d={arcPath(CX, CY, r, seg.start, seg.end)}
              fill="none"
              strokeWidth={thickness}
              strokeLinecap="round"
              className={cn(
                track ? "stroke-chart-track" : ["seg", STROKE[part.series - 1]],
                "transition-opacity duration-200 group-has-[.seg:hover]/gauge:opacity-35 hover:opacity-100!",
              )}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                pathLength: { duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.1 + i * 0.14, ease: EASE },
                opacity: { duration: reduce ? 0 : 0.15, delay: reduce ? 0 : 0.1 + i * 0.14 },
              }}
            >
              {part ? <title>{`${part.label}: %${Math.round(seg.share * 100)}`}</title> : null}
            </m.path>
          );
        })}
      </svg>
      <div aria-hidden className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
        {children ?? (
          <>
            <span className="text-display leading-none font-semibold tracking-tight text-strong tabular-nums">%{Math.round(share * 100)}</span>
            <span className="mt-1.5 text-small text-muted">{label ?? focus?.label}</span>
          </>
        )}
      </div>
    </div>
  );
}
