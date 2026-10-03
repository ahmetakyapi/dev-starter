import { cn } from "@/lib/utils";

/**
 * Mini eğri: eksensiz, ızgarasız SVG; son nokta vurgulu. Sunucuda çizilir,
 * istemciye JavaScript inmez.
 *
 * Eğri bir EĞİLİM işareti; okunacak sayı yanındaki `Stat`. Bu yüzden eksen,
 * etiket ve imleç yok. Tek seri olduğu için lejant da yok: `title` seriyi
 * adlandırır ve ekran okuyucu onu okur (`role="img"`).
 *
 * TON: `auto` ilk ve son noktayı karşılaştırır (yükselen success, düşen
 * danger). Yalnızca fiyat gibi "yükselmek iyi" olan serilerde kullan; faiz,
 * işsizlik, gecikme gibi serilerde `primary` (varsayılan): renk orada bir
 * yargı gibi okunur.
 *
 * `vector-effect: non-scaling-stroke`: kutu esnese de çizgi kalınlığı sabit.
 */

type SparklineProps = {
  values: readonly number[];
  /** Ekran okuyucu adı: "Son 30 Gün Kapanış". */
  title: string;
  width?: number;
  height?: number;
  tone?: "primary" | "auto" | "muted";
  area?: boolean;
  className?: string;
};

/** Alan dolgusunun opaklığı: çizgiyi bastırmayacak kadar hafif. */
const AREA_OPACITY = 0.1;

export function Sparkline({ values, title, width = 120, height = 32, tone = "primary", area = true, className }: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastX = x(values.length - 1);
  const lastY = y(values.at(-1)!);

  const first = values[0];
  const last = values.at(-1)!;
  const color =
    tone === "muted"
      ? "var(--text-muted)"
      : tone === "auto"
        ? last > first
          ? "var(--success)"
          : last < first
            ? "var(--danger)"
            : "var(--text-muted)"
        : "var(--primary)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      preserveAspectRatio="none"
      className={cn("block max-w-full overflow-visible", className)}
    >
      {area ? (
        <polygon
          points={`${x(0).toFixed(1)},${height} ${points} ${lastX.toFixed(1)},${height}`}
          fill={color}
          opacity={AREA_OPACITY}
        />
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Son nokta: zeminden bir halka ayırır, eğri neresinde biterse bitsin seçilir. */}
      <circle cx={lastX} cy={lastY} r={4.5} fill="var(--page-bg)" />
      <circle cx={lastX} cy={lastY} r={2.75} fill={color} />
    </svg>
  );
}
