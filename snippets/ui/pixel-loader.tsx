import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Piksel yükleyici: nokta matrisinde dolaşan ışık. Spinner'ın karakterli
 * kardeşi: üretim süren yapay zekâ kartı, terminal havası taşıyan geliştirici
 * aracı, oyun ve topluluk ekranları. Düğme içi kısa beklemede `spinner`
 * kalır; bu, kart ya da bölüm düzeyinde.
 *
 * DESENLER: noktaların gecikmesi desene göre hesaplanır, animasyon tek
 * keyframe (opaklık + boy). `wave` çapraz dalga, `spiral` dıştan içe
 * sarmal, `pulse` merkezden halka, `snake` satır satır yılan, `rain`
 * sütun sütun yağmur.
 *
 * Nokta HİÇ KAYBOLMAZ: en sönük karede %18 opaklık ve 0,7 boy (sıfırdan
 * büyüyen nesne yok). Renk `currentColor`: varsayılan `text-primary`,
 * çağıran değiştirebilir. `glow` ışığı aynı rengin saydamı, gölge değil.
 *
 * `role="status"` + gizli etiket. Hareketi azaltan kullanıcıda dama deseni
 * durağan kalır. Sunucu bileşeni: yalnız CSS.
 *
 *   <PixelLoader pattern="spiral" grid={5} label="Görsel üretiliyor" />
 */

const CSS = `
@keyframes ui-pixel { 0%, 100% { opacity: 0.18; scale: 0.7; } 40% { opacity: 1; scale: 1; } }
.ui-pixel { border-radius: 9999px; background: currentColor; opacity: 0.18; scale: 0.7;
  animation: ui-pixel var(--px-duration) var(--ease-brand) infinite; animation-delay: var(--px-delay); }
.ui-pixel-glow .ui-pixel { filter: drop-shadow(0 0 calc(var(--px-dot) * 0.6) color-mix(in oklab, currentColor 70%, transparent)); }
@media (prefers-reduced-motion: reduce) {
  .ui-pixel { animation: none; }
  .ui-pixel[data-even="true"] { opacity: 0.85; scale: 1; }
}`;

export type PixelPattern = "wave" | "spiral" | "pulse" | "snake" | "rain";

/** Her hücrenin sıradaki yeri, 0..1 (gecikmenin oranı). */
function order(pattern: PixelPattern, n: number): number[] {
  const cells = Array.from({ length: n * n }, (_, i) => ({ r: Math.floor(i / n), c: i % n }));
  const c = (n - 1) / 2;
  switch (pattern) {
    case "wave":
      return cells.map(({ r, c: col }) => (r + col) / (2 * (n - 1) || 1));
    case "pulse": {
      const max = Math.hypot(c, c) || 1;
      return cells.map(({ r, c: col }) => Math.hypot(r - c, col - c) / max);
    }
    case "snake":
      return cells.map(({ r, c: col }) => (r * n + (r % 2 ? n - 1 - col : col)) / (n * n - 1 || 1));
    case "rain":
      // Sütun başına sabit ama sıralı olmayan başlangıç: yağmur damlası gibi dağınık.
      return cells.map(({ r, c: col }) => (((col * 7) % n) / n + r / (n * 2)) % 1);
    case "spiral": {
      const rank = new Array<number>(n * n).fill(0);
      let top = 0, left = 0, bottom = n - 1, right = n - 1, k = 0;
      while (top <= bottom && left <= right) {
        for (let i = left; i <= right; i++) rank[top * n + i] = k++;
        for (let i = top + 1; i <= bottom; i++) rank[i * n + right] = k++;
        for (let i = right - 1; i >= left && top < bottom; i--) rank[bottom * n + i] = k++;
        for (let i = bottom - 1; i > top && left < right; i--) rank[i * n + left] = k++;
        top++; left++; bottom--; right--;
      }
      return rank.map((v) => v / (n * n - 1 || 1));
    }
  }
}

type PixelLoaderProps = {
  pattern?: PixelPattern;
  /** Kenardaki nokta sayısı: 3 (satır içi) ya da 5 (kart). */
  grid?: 3 | 4 | 5;
  /** Bir noktanın pikseli. */
  dot?: number;
  /** Bir turun saniyesi. */
  duration?: number;
  glow?: boolean;
  label?: string;
  className?: string;
};

export function PixelLoader({
  pattern = "wave",
  grid = 3,
  dot = 6,
  duration = 1.4,
  glow = false,
  label = "Yükleniyor",
  className,
}: PixelLoaderProps) {
  const delays = order(pattern, grid);
  return (
    <>
      <style href="ui-pixel-loader" precedence="default">
        {CSS}
      </style>
      <span role="status" className={cn("inline-flex text-primary", glow && "ui-pixel-glow", className)}>
        <span
          aria-hidden
          className="grid"
          style={
            {
              gridTemplateColumns: `repeat(${grid}, ${dot}px)`,
              gap: Math.max(2, Math.round(dot * 0.5)),
              "--px-duration": `${duration}s`,
              "--px-dot": `${dot}px`,
            } as CSSProperties
          }
        >
          {delays.map((d, i) => (
            <span
              key={i}
              data-even={(Math.floor(i / grid) + (i % grid)) % 2 === 0}
              className="ui-pixel"
              style={{ width: dot, height: dot, "--px-delay": `${(d * duration * 0.8).toFixed(3)}s` } as CSSProperties}
            />
          ))}
        </span>
        <span className="sr-only">{label}</span>
      </span>
    </>
  );
}
