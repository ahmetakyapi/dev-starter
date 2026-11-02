import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * İç içe halka grafiği: her seri kendi izinde (track) bir yay. Az sayıda
 * (2-5) kategorinin büyüklük sırasını göstermek için; tam pay oranı
 * okunacaksa `stage-bars.tsx` daha dürüst (uzunluk açıdan iyi okunur).
 *
 * Yaylar en büyük değere göre ölçeklenir ve en büyüğü tam tur DEĞİL,
 * `sweep` kadar (varsayılan %92) döner: kapanmış bir halka "bütün" gibi
 * okunur, oysa burada bütün yok, yalnızca kıyas var. En büyük seri dışta.
 *
 * Fareyle bir yayın üstüne gelince diğerleri geri çekilir (CSS `:has`, JS
 * yok). Ortadaki alan `children`: başlık değeri ya da seçili seri.
 *
 * Renk `--chart-*` token'ından (`stroke-chart-N`); sıra lejantla aynı
 * olmalı, lejant için `ChartLegend` (chart-card.tsx). Erişilebilirlik:
 * `role="img"` + `title`; değerlerin metni lejantta.
 */

const STROKE = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"] as const;

type Ring = { label: string; value: number; series: 1 | 2 | 3 | 4 | 5 | 6 };

export function RingChart({
  rings,
  title,
  sweep = 0.92,
  thickness = 9,
  gap = 4,
  children,
  className,
}: {
  rings: readonly Ring[];
  /** Ekran okuyucu adı: "Tarayıcıya Göre Ziyaretçi". */
  title: string;
  sweep?: number;
  /** Halka kalınlığı ve halkalar arası boşluk, viewBox birimi (200 üzerinden). */
  thickness?: number;
  gap?: number;
  children?: ReactNode;
  className?: string;
}) {
  const sorted = [...rings].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value || 1;
  const outer = 100 - thickness / 2;
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-64", className)}>
      <svg viewBox="0 0 200 200" role="img" className="group/rings size-full -rotate-90">
        <title>{title}</title>
        {sorted.map((ring, i) => {
          const r = outer - i * (thickness + gap);
          if (r <= thickness) return null;
          const arc = (ring.value / max) * sweep * 100;
          return (
            <g key={ring.label}>
              <circle cx="100" cy="100" r={r} fill="none" strokeWidth={thickness} className="stroke-chart-track" />
              <circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                pathLength={100}
                strokeDasharray={`${arc} 100`}
                strokeWidth={thickness}
                strokeLinecap="round"
                className={cn(
                  "ring transition-opacity duration-200 group-has-[.ring:hover]/rings:opacity-35 hover:opacity-100!",
                  STROKE[ring.series - 1],
                )}
              >
                <title>{`${ring.label}: ${ring.value.toLocaleString("tr-TR")}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center text-center">{children}</div> : null}
    </div>
  );
}
