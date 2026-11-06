// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { m, useReducedMotion } from "motion/react";
import { cn } from "../utils";
import type { Series } from "./chart-card";

/**
 * Radar (örümcek ağı) grafiği: 5-8 ölçütte bir ya da iki varlığın profili
 * ("Bu Sürüm / Önceki Sürüm" Hız, Erişilebilirlik, SEO…). Profilin ŞEKLİ
 * okunur: dengeli mi, bir yöne mi çekiyor. Kesin değer kıyası için tablo ya
 * da çubuk daha dürüst; bu yüzden değerler `sr-only` tabloda ve her noktanın
 * `title`ında da var.
 *
 * NEDEN EN ÇOK İKİ SERİ: üçüncü çokgen ilk ikisinin üstüne biner ve dolgu
 * kesişimleri çamura döner. Üç ve üstü varlık için küçük çoklu radarlar
 * (her biri kendi kartında) yan yana.
 *
 * Izgara DÜZ ÇOKGEN, daire değil: eksenler arası doğru parçaları değerin
 * gerçekten çizildiği şekil; dairesel ızgara çokgenin kenarında olmayan bir
 * değeri ima eder. Dört halka, en dıştaki `max`.
 *
 * Etiketler HTML ve açıya göre dışa yaslanır (sağdaki sola, soldaki sağa,
 * tepedeki ortaya): SVG metni esneyen viewBox'ta ölçeklenir ve punto
 * ölçeğinden çıkar. Kısa tut: telefonda etiket başına ~70 px.
 *
 * Hareket: ekrana girince çokgen merkezden değerlerine AÇILIR (yol
 * biçimlenir, nesne büyütülmez: çubuğun sıfırdan yükselmesi gibi bir veri
 * hareketi). Hareketi azaltan kullanıcıda süre 0. Fareyle bir serinin
 * üstüne gelince diğeri geri çekilir (CSS `:has`).
 */

type RadarSeries = { label: string; values: readonly number[]; series?: Series };

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;
const FILL = ["fill-chart-1/20", "fill-chart-2/20", "fill-chart-3/20", "fill-chart-4/20", "fill-chart-5/20", "fill-chart-6/20"] as const;
const DOT = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5", "fill-chart-6"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

const R = 100;
const BOX = 330;

/** i. eksenin açısı: ilk eksen tepede, saat yönünde. */
const angle = (i: number, n: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;

/** Değerleri (0..max) radar köşelerine çevirir; merkez (0, 0), yarıçap `r`. Saf. */
export function radarPoints(values: readonly number[], max: number, r = R): [number, number][] {
  const n = values.length;
  return values.map((v, i) => {
    const k = Math.min(Math.max(v / (max || 1), 0), 1) * r;
    const a = angle(i, n);
    return [Math.round(Math.cos(a) * k * 100) / 100, Math.round(Math.sin(a) * k * 100) / 100];
  });
}

const toPath = (pts: readonly (readonly [number, number])[]) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}Z`;

export function RadarChart({
  axes,
  series,
  title,
  max = 100,
  unit,
  className,
}: {
  /** 5-8 kısa eksen adı: "Hız", "SEO". */
  axes: readonly string[];
  /** Bir ya da iki seri; değerler `axes` sırasıyla. */
  series: readonly RadarSeries[];
  /** Grafiğin ve tablonun adı: "Lighthouse Profili". */
  title: string;
  max?: number;
  /** Tablo ve nokta başlığında değerin ardına: "puan". */
  unit?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const n = axes.length;
  const rings = [0.25, 0.5, 0.75, 1];
  const zero = axes.map(() => 0);
  const fmt = (v: number) => v.toLocaleString("tr-TR") + (unit ? ` ${unit}` : "");

  return (
    <figure className={cn("w-full", className)}>
      <div className="sr-only">
        {/* sr-only kap DIŞTA: <table> width: 1px'i yok sayar, uzun etiketle sayfayı yana taşırır. */}
        <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Ölçüt</th>
            {series.map((s) => (
              <th key={s.label} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {axes.map((axis, i) => (
            <tr key={axis}>
              <th scope="row">{axis}</th>
              {series.map((s) => (
                <td key={s.label}>{fmt(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div aria-hidden className="relative mx-auto aspect-square w-full max-w-80">
        <svg viewBox={`${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`} className="group/radar absolute inset-0 size-full overflow-visible">
          {rings.map((k) => (
            <path key={k} d={toPath(radarPoints(axes.map(() => max), max, R * k))} fill="none" className={k === 1 ? "stroke-line-strong" : "stroke-line"} />
          ))}
          {radarPoints(
            axes.map(() => max),
            max,
          ).map(([x, y], i) => (
            <line key={i} x1={0} y1={0} x2={x} y2={y} className="stroke-line" />
          ))}

          {series.map((s, si) => {
            const tone = (s.series ?? ((si + 1) as Series)) - 1;
            const pts = radarPoints(s.values, max);
            const transition = { duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.1 + si * 0.15, ease: EASE };
            const view = { once: true, amount: 0.5 } as const;
            return (
              <g key={s.label} className="series transition-opacity duration-200 group-has-[.series:hover]/radar:opacity-30 hover:opacity-100!">
                <m.path
                  className={cn(FILL[tone], STROKE[tone])}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  initial={{ d: toPath(reduce ? pts : radarPoints(zero, max)) }}
                  whileInView={{ d: toPath(pts) }}
                  viewport={view}
                  transition={transition}
                />
                {pts.map(([x, y], i) => (
                  <m.circle
                    key={i}
                    r={4}
                    strokeWidth={2}
                    className={cn(DOT[tone], "stroke-overlay")}
                    initial={reduce ? { cx: x, cy: y } : { cx: 0, cy: 0 }}
                    whileInView={{ cx: x, cy: y }}
                    viewport={view}
                    transition={transition}
                  >
                    <title>{`${s.label} · ${axes[i]}: ${fmt(s.values[i] ?? 0)}`}</title>
                  </m.circle>
                ))}
              </g>
            );
          })}
        </svg>

        {axes.map((axis, i) => {
          const a = angle(i, n);
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const k = (R + 14) / BOX;
          return (
            <span
              key={axis}
              className={cn(
                "absolute max-w-24 text-small leading-tight font-medium text-body",
                cos > 0.3 ? "text-left" : cos < -0.3 ? "-translate-x-full text-right" : "-translate-x-1/2 text-center",
                sin > 0.3 ? "" : sin < -0.3 ? "-translate-y-full" : "-translate-y-1/2",
              )}
              style={{ left: `${50 + cos * k * 100}%`, top: `${50 + sin * k * 100}%` }}
            >
              {axis}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
