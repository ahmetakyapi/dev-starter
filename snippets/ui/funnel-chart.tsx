"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChartLegend, type Series } from "@/components/ui/chart-card";

/**
 * Huni grafiği: soldan sağa daralan aşamalar (Ziyaret → Sepet → Ödeme →
 * Sipariş), her sütunun üstünde ilk aşamaya göre yüzde hapı, altta lejant
 * karoları. Panoda "nerede kaybediyoruz" sorusunun bir bakışta cevabı.
 *
 * NE ZAMAN BU, NE ZAMAN `stage-bars.tsx`: huni şekli KAYBIN YERİNİ gösterir
 * (en dik iniş göze ilk çarpar); kesin kıyas gerekiyorsa ortak tabanlı
 * çubuk daha dürüst. Bu yüzden sayı şekle bırakılmaz: her sütunda hap,
 * lejantta tam değer.
 *
 * ŞEKİL: her sütunun ilk %58'i düz (aşamanın kendi yüksekliği), kalanı bir
 * sonraki aşamaya geçiş. `shape="curve"` geçişi kübik eğriyle yumuşatır,
 * `"step"` düz çizgiyle keser (keskin, daha "tablo" hissi). Yükseklik ilk
 * aşamaya oranlı ve dikeyde ortalı; çok küçük aşama görünmez olmasın diye
 * en az %6.
 *
 * Sütunlar arasındaki kesik kart zemininin renginde (`stroke-surface`):
 * aşamalar ayrı parçalar gibi okunur, ek bir ayırıcı çizgi gerekmez.
 *
 * Renk sırası lejantla aynı: aşama i → `--chart-(i+1)`. Hap beyaz karo
 * (`bg-overlay shadow-raised`), seri rengi metin olmaz.
 *
 * Hareket: ekrana girince şekil soldan sağa açılır (kırpma dikdörtgeni
 * `scaleX`, nesne değil perde), haplar ardından sırayla gelir. Hareketi
 * azaltan kullanıcıda süre 0.
 *
 * Erişilebilirlik: çizim `aria-hidden`; aşamalar `sr-only` bir `ol` içinde
 * "Sepet 3.720, ilk aşamaya göre %30" diye okunur; lejant bir `dl`.
 */

type Stage = { label: string; value: number };

const FILL = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5", "fill-chart-6"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const COL = 100;
const H = 100;
const FLAT = 0.58;

/** Huninin sütun yolları, viewBox `n*100 × 100`. Saf; test edilebilir. */
export function funnelPaths(values: readonly number[], shape: "curve" | "step" = "curve"): string[] {
  const base = values[0] || 1;
  const h = values.map((v) => Math.max(v / base, 0.06) * H);
  const top = (i: number) => (H - h[i]) / 2;
  const bottom = (i: number) => (H + h[i]) / 2;
  return values.map((_, i) => {
    const x0 = i * COL;
    const x1 = x0 + COL;
    if (i === values.length - 1) return `M${x0},${top(i)}H${x1}V${bottom(i)}H${x0}Z`;
    const xf = x0 + COL * FLAT;
    const t0 = top(i);
    const t1 = top(i + 1);
    const b0 = bottom(i);
    const b1 = bottom(i + 1);
    if (shape === "step") return `M${x0},${t0}H${xf}L${x1},${t1}V${b1}L${xf},${b0}H${x0}Z`;
    const k = (x1 - xf) / 2;
    return `M${x0},${t0}H${xf}C${xf + k},${t0},${x1 - k},${t1},${x1},${t1}V${b1}C${x1 - k},${b1},${xf + k},${b0},${xf},${b0}H${x0}Z`;
  });
}

const number = new Intl.NumberFormat("tr-TR");

export function FunnelChart({
  stages,
  title,
  shape = "curve",
  legend = true,
  height = "h-40",
  className,
}: {
  /** 2-6 aşama, büyükten küçüğe. */
  stages: readonly Stage[];
  /** Ekran okuyucu adı: "Ödeme Hunisi". */
  title: string;
  shape?: "curve" | "step";
  /** Altta `ChartLegend` karoları. */
  legend?: boolean;
  /** Çizim alanı yüksekliği: Tailwind sınıfı. */
  height?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  // Gözlemci kapta: `<defs>` içindeki kırpma dikdörtgeni boyutsuz, onu gözlemlemek güvenilmez.
  const frame = useRef<HTMLElement>(null);
  // Hareket azaltmada görünür olmayı BEKLEME: son hal hemen çizilir. Yoksa
  // ekran dışındaki grafik baskıda, tam sayfa görüntüde ve kaydırmadan önce boş kalır.
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const clip = `funnel-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const base = stages[0]?.value || 1;
  const paths = funnelPaths(
    stages.map((s) => s.value),
    shape,
  );
  const W = stages.length * COL;
  const share = (v: number) => Math.round((v / base) * 100);

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <ol aria-label={title} className="sr-only">
        {stages.map((s) => (
          <li key={s.label}>
            {s.label} {number.format(s.value)}, ilk aşamaya göre %{share(s.value)}
          </li>
        ))}
      </ol>

      <div aria-hidden>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((s, i) => (
            <div key={s.label} className="flex justify-center px-0.5">
              <m.span
                className="rounded-full bg-overlay px-2 py-0.5 text-small font-semibold text-strong tabular-nums shadow-raised"
                initial={{ opacity: 0, y: 4 }}
                animate={seen ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.35 + i * 0.12, ease: EASE }}
              >
                %{share(s.value)}
              </m.span>
            </div>
          ))}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("mt-3 block w-full", height)}>
          <defs>
            <clipPath id={clip}>
              <m.rect
                x={0}
                y={0}
                width={W}
                height={H}
                style={{ originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={seen ? { scaleX: 1 } : undefined}
                transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            {paths.map((d, i) => (
              <path key={i} d={d} className={FILL[i % FILL.length]} />
            ))}
          </g>
          {stages.slice(1).map((s, i) => (
            <line
              key={s.label}
              x1={(i + 1) * COL}
              x2={(i + 1) * COL}
              y1={0}
              y2={H}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              className="stroke-surface"
            />
          ))}
        </svg>
      </div>

      {legend ? (
        <ChartLegend
          className="mt-5"
          columns={stages.length % 3 === 0 ? 3 : 2}
          items={stages.map((s, i) => ({ label: s.label, value: s.value, series: ((i % 6) + 1) as Series }))}
        />
      ) : null}
    </figure>
  );
}
