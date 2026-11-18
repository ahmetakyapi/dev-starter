"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChartLegend, type Series } from "@/components/ui/chart-card";

/**
 * Huni grafiği: soldan sağa daralan aşamalar (Ziyaret → İnceleme → Sepet →
 * Sipariş). Panoda "hangi adımda kaybediyoruz" sorusunun bir bakışta cevabı.
 *
 * NE ZAMAN BU, NE ZAMAN `stage-bars.tsx`: huni şekli KAYBIN YERİNİ gösterir
 * (en dik iniş göze ilk çarpar); kesin kıyas gerekiyorsa ortak tabanlı
 * çubuk daha dürüst. Sayı şekle bırakılmaz: her sütunun üstünde aşamanın
 * adı ve değeri, altında bir ÖNCEKİ adıma göre dönüşüm ("→ %28").
 *
 * TEK RENK (2026-11-18): aşamalar aynı ölçünün devamı, ayrı kategori değil;
 * eskiden her aşama ayrı `--chart-*` rengindeydi (gökkuşağı, anlam
 * taşımıyordu). Şimdi tek seri rengi (`series`, varsayılan 1) ve her
 * sütunda bir önceki aşamanın yüksekliği soluk İZ olarak kalır: izle dolgu
 * arasındaki fark o adımda kaybedilen kısım. Lejant varsayılan kapalı
 * (adlar sütunda); `legend` ile açılır.
 *
 * ŞEKİL: her sütunun ilk %58'i düz (aşamanın kendi yüksekliği), kalanı bir
 * sonraki aşamaya geçiş. `shape="curve"` geçişi kübik eğriyle yumuşatır,
 * `"step"` düz çizgiyle keser. Yükseklik ilk aşamaya oranlı ve dikeyde
 * ortalı; çok küçük aşama görünmez olmasın diye en az %6 (sayı yine doğru).
 *
 * Hareket: ekrana girince şekil soldan sağa açılır (kırpma dikdörtgeni
 * `scaleX`), dönüşüm hapları ardından sırayla gelir. Hareketi azaltan
 * kullanıcıda süre 0.
 *
 * Erişilebilirlik: çizim `aria-hidden`; aşamalar `sr-only` bir `ol` içinde
 * "Sepet 346, önceki aşamadan %18, ilk aşamaya göre %5" diye okunur.
 */

type Stage = { label: string; value: number };

const FILL = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5", "fill-chart-6"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const COL = 100;
const H = 100;
const FLAT = 0.58;

/** Huninin sütun yolları, viewBox `n*100 × 100`. Saf; test edilebilir. */
/** Her sütunda bir önceki aşamanın yüksekliği (ilk sütunda yok): kaybı gösteren soluk iz. */
export function funnelGhosts(values: readonly number[]): (string | null)[] {
  const base = values[0] || 1;
  const h = values.map((v) => Math.max(v / base, 0.06) * H);
  return values.map((_, i) => {
    if (i === 0) return null;
    const x0 = i * COL;
    const t = (H - h[i - 1]) / 2;
    return `M${x0},${t}H${x0 + COL}V${t + h[i - 1]}H${x0}Z`;
  });
}

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
  series = 1,
  legend = false,
  height = "h-40",
  className,
}: {
  /** 2-6 aşama, büyükten küçüğe. */
  stages: readonly Stage[];
  /** Ekran okuyucu adı: "Ödeme Hunisi". */
  title: string;
  shape?: "curve" | "step";
  /** Tek seri rengi (`--chart-N`). */
  series?: Series;
  /** Altta `ChartLegend` karoları (adlar zaten sütunda; varsayılan kapalı). */
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
  const values = stages.map((s) => s.value);
  const base = values[0] || 1;
  const paths = funnelPaths(values, shape);
  const ghosts = funnelGhosts(values);
  const W = stages.length * COL;
  const pct = (v: number, of: number) => {
    const p = of ? (v / of) * 100 : 0;
    return p > 0 && p < 1 ? p.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : String(Math.round(p));
  };
  const cols = { gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` };
  const fill = FILL[(series - 1) % 6];

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <ol aria-label={title} className="sr-only">
        {stages.map((s, i) => (
          <li key={s.label}>
            {s.label} {number.format(s.value)}
            {i > 0 ? `, önceki aşamadan %${pct(s.value, stages[i - 1].value)}, ilk aşamaya göre %${pct(s.value, base)}` : ""}
          </li>
        ))}
      </ol>

      <div aria-hidden>
        {/* Aşama adı + değer: sütunun tam üstünde (lejanta göz gezdirmeden okunur). */}
        <div className="grid gap-x-2" style={cols}>
          {stages.map((s) => (
            <div key={s.label} className="grid min-w-0 content-end gap-0.5 px-1">
              <span className="line-clamp-2 text-small text-muted">{s.label}</span>
              <span className="text-base font-semibold text-strong tabular-nums">{number.format(s.value)}</span>
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
            {ghosts.map((d, i) => (d ? <path key={`g${i}`} d={d} className={cn(fill, "opacity-15")} /> : null))}
            {paths.map((d, i) => (
              <path key={i} d={d} className={fill} />
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

        {/* Adım dönüşümü: bir önceki aşamaya göre. İlk sütun başlangıç. */}
        <div className="mt-3 grid gap-x-2" style={cols}>
          {stages.map((s, i) => (
            <div key={s.label} className="flex justify-center px-0.5">
              {i === 0 ? (
                <span className="px-2 py-0.5 text-small text-muted">Başlangıç</span>
              ) : (
                <m.span
                  className="rounded-full bg-overlay px-2 py-0.5 text-small font-semibold whitespace-nowrap text-strong tabular-nums shadow-raised"
                  initial={{ opacity: 0, y: 4 }}
                  animate={seen ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.35 + i * 0.12, ease: EASE }}
                >
                  → %{pct(s.value, stages[i - 1].value)}
                </m.span>
              )}
            </div>
          ))}
        </div>
      </div>

      {legend ? (
        <ChartLegend
          className="mt-5"
          columns={stages.length % 3 === 0 ? 3 : 2}
          items={stages.map((s) => ({ label: s.label, value: s.value, series }))}
        />
      ) : null}
    </figure>
  );
}
