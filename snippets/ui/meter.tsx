"use client";

import { Meter as Base } from "@base-ui/react/meter";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ölçer: bilinen bir aralıkta DOLULUK (depolama, kota, koltuk sayısı, şifre
 * gücü). Bir işin ilerlemesi değil: o `progress.tsx`. Ekran okuyucu bunu
 * `meter` diye okur ("38,4 GB / 50 GB, ölçer"); ilerleme gibi "bitecek"
 * beklentisi kurmaz.
 *
 * EŞİKLER: doluluk oranı `warn` eşiğini geçince dolgu uyarı tonuna, `danger`
 * eşiğini geçince hata tonuna döner (varsayılan %75 ve %90). Renk tek
 * işaret değil: eşik aşıldığında değerin yanına kısa durum metni gelir
 * ("Az Yer Kaldı", "Kota Doldu") ve bu metin `aria-valuetext`e de eklenir.
 * Ters ölçek (şifre gücü: yüksek iyi) için `inverted`.
 *
 * Dolgu `progress.tsx` ile aynı: iz kadar geniş hap, `translateX` ile kayar,
 * uç her değerde yuvarlak; genişlik animasyonu yok.
 *
 * Değer metni `format` ile verilir: ham sayıyı birimiyle biçimlemek
 * çağıranın işi ("38,4 GB"). Verilmezse `tr-TR` yüzde.
 */

const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });

type Level = "ok" | "warn" | "danger";

const FILL: Record<Level, string> = { ok: "bg-primary", warn: "bg-warning", danger: "bg-danger" };
const TEXT: Record<Level, string> = { ok: "text-muted", warn: "text-warning", danger: "text-danger" };

type MeterProps = {
  value: number;
  min?: number;
  max?: number;
  /** Title Case etiket: "Depolama". */
  label: ReactNode;
  /** Görünen değer: "38,4 GB / 50 GB". Verilmezse yüzde. */
  valueText?: string;
  /** Oran (0–1) eşikleri. */
  thresholds?: { warn: number; danger: number };
  /** Eşik aşılınca değerin yanında görünen ve okunan metin. */
  statusText?: { warn: string; danger: string };
  /** Yüksek değer İYİ ise (şifre gücü): renk sırası tersine döner. */
  inverted?: boolean;
  hint?: ReactNode;
  className?: string;
};

export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  valueText,
  thresholds = { warn: 0.75, danger: 0.9 },
  statusText = { warn: "Az Yer Kaldı", danger: "Neredeyse Dolu" },
  inverted = false,
  hint,
  className,
}: MeterProps) {
  const hintId = useId();
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const gauge = inverted ? 1 - ratio : ratio;
  const level: Level = gauge >= thresholds.danger ? "danger" : gauge >= thresholds.warn ? "warn" : "ok";
  const shown = valueText ?? percent.format(ratio);
  const status = level === "ok" ? null : statusText[level];

  return (
    <Base.Root
      value={value}
      min={min}
      max={max}
      aria-valuetext={status ? `${shown}, ${status}` : shown}
      aria-describedby={hint ? hintId : undefined}
      className={cn("grid gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Base.Label className="min-w-0 truncate text-base font-medium text-strong">{label}</Base.Label>
        <span aria-hidden className="flex shrink-0 items-baseline gap-2 text-small tabular-nums">
          {status ? <span className={cn("font-semibold", TEXT[level])}>{status}</span> : null}
          <span className="font-medium text-strong">{shown}</span>
        </span>
      </div>

      <Base.Track className="relative h-2 overflow-hidden rounded-full bg-chart-track">
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-[transform,background-color] duration-300 motion-reduce:transition-none",
            FILL[level],
          )}
          style={{ transform: `translateX(-${(1 - ratio) * 100}%)` }}
        />
      </Base.Track>

      {hint ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
    </Base.Root>
  );
}

type MeterSegment = { label: string; value: number; series: 1 | 2 | 3 | 4 | 5 | 6 };

const SERIES_BG = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

/**
 * Bölümlü ölçer: doluluğun NEYDEN oluştuğu (Belgeler, Görseller, Yedek).
 * Bölüm rengi `--chart-*` (seri rengi, metin değil); okunan ad ve değer
 * altındaki lejantta. Görsel çubuk `aria-hidden`, toplam `role="meter"`.
 */
export function SegmentedMeter({
  label,
  segments,
  max,
  format = (n) => String(n),
  className,
}: {
  label: string;
  segments: readonly MeterSegment[];
  max: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const used = segments.reduce((sum, s) => sum + s.value, 0);
  const labelId = useId();
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-base font-medium text-strong">
          {label}
        </span>
        <span className="text-small font-medium text-strong tabular-nums">
          {format(used)} <span className="text-muted">/ {format(max)}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={used}
        aria-valuetext={`${format(used)} / ${format(max)}`}
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-chart-track"
      >
        {segments.map((s) => (
          <span
            key={s.label}
            aria-hidden
            className={cn("h-full shrink-0 first:rounded-l-full", SERIES_BG[s.series - 1])}
            style={{ flexBasis: `${(s.value / max) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-small">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2 rounded-full", SERIES_BG[s.series - 1])} />
            <span className="text-body">{s.label}</span>
            <span className="font-medium text-strong tabular-nums">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
