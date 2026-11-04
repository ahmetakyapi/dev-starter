"use client";

import { Meter as Base } from "@base-ui/react/meter";
import { useId, useState, type ReactNode } from "react";
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

export type MeterSegment = { label: string; value: number; series: 1 | 2 | 3 | 4 | 5 | 6 };

const SERIES_BG = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

/**
 * Bölümlü ölçer: doluluğun NEYDEN oluştuğu (Belgeler, Görseller, Yedek).
 * Bölüm rengi `--chart-*` (seri rengi, metin değil); okunan ad ve değer
 * altındaki lejantta. Görsel çubuk `aria-hidden`, toplam `role="meter"`.
 *
 * İKİ BOY:
 *   - `sm` (varsayılan): ayar satırı ve rapor kuyusu; ince çubuk, düz lejant.
 *   - `lg`: kendi karosunda duran kota kartı ("Dosya Alanı", "Bağlam").
 *     Toplam display puntoda, çubuk kalın ve bölümler AYRIK (her biri kendi
 *     köşesiyle; kalan pay da bir bölüm gibi iz rengiyle), lejant hap.
 *
 * ODAK BÖLÜM: lejanttaki bir hapın üzerine gelince ya da hap klavyeyle
 * odaklanınca o bölüm öne çıkar, ötekiler söner ve başlıktaki rakam o bölümün
 * değerine döner ("Ekler · 3,1 GB"). Yalnız görsel bir yakınlaştırma: aynı
 * değer hapın içinde zaten yazılı, ekran okuyucuya ayrıca söylenmez. Sönme
 * `opacity` ile, genişlik canlandırılmaz.
 *
 * DOLMAK ÜZERE: oran `warnAt`ı (0,9) geçince kalan pay `warning-fill` ile
 * boyanır ve başlığın yanında "Az Yer Kaldı" yazar (renk tek işaret değil).
 */
export function SegmentedMeter({
  label,
  segments,
  max,
  format = (n) => String(n),
  size = "sm",
  warnAt = 0.9,
  warnText = "Az Yer Kaldı",
  className,
}: {
  label: string;
  segments: readonly MeterSegment[];
  max: number;
  format?: (value: number) => string;
  size?: "sm" | "lg";
  /** Bu oranın üstünde kalan pay uyarı rengine döner. */
  warnAt?: number;
  warnText?: string;
  className?: string;
}) {
  const used = segments.reduce((sum, s) => sum + s.value, 0);
  const labelId = useId();
  const [focus, setFocus] = useState<string | null>(null);
  const active = segments.find((s) => s.label === focus) ?? null;
  const rest = Math.max(0, max - used);
  const warn = max > 0 && used / max >= warnAt;
  const lg = size === "lg";

  const legend = segments.map((s) => {
    const dim = active !== null && active.label !== s.label;
    return (
      <li
        key={s.label}
        tabIndex={0}
        onPointerEnter={() => setFocus(s.label)}
        onPointerLeave={() => setFocus(null)}
        onFocus={() => setFocus(s.label)}
        onBlur={() => setFocus(null)}
        className={cn(
          "flex items-center gap-1.5 transition-opacity duration-200 outline-offset-2",
          lg ? "min-h-8 rounded-full bg-surface-raised px-3 py-1 text-base" : "rounded-sm text-small",
          dim && "opacity-45",
        )}
      >
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", SERIES_BG[s.series - 1])} />
        <span className="text-body">{s.label}</span>
        <span className="font-medium text-strong tabular-nums">{format(s.value)}</span>
      </li>
    );
  });

  const bar = (
    <div
      role="meter"
      aria-labelledby={labelId}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={used}
      aria-valuetext={`${format(used)} / ${format(max)}${warn ? `, ${warnText}` : ""}`}
      className={cn("flex overflow-hidden", lg ? "h-10 gap-1 rounded-lg" : "h-2 gap-0.5 rounded-full bg-chart-track")}
    >
      {segments.map((s) => (
        <span
          key={s.label}
          aria-hidden
          className={cn(
            "h-full shrink-0 transition-opacity duration-200",
            lg ? "rounded-sm first:rounded-l-lg" : "first:rounded-l-full",
            SERIES_BG[s.series - 1],
            active !== null && active.label !== s.label && "opacity-30",
          )}
          style={{ flexBasis: `calc(${(s.value / max) * 100}% - ${lg ? 4 : 2}px)` }}
        />
      ))}
      {lg && rest > 0 ? (
        <span aria-hidden className={cn("h-full min-w-1 flex-1 rounded-sm rounded-r-lg", warn ? "bg-warning-fill/35" : "bg-chart-track")} />
      ) : null}
    </div>
  );

  if (!lg) {
    return (
      <div className={cn("grid gap-3", className)}>
        <div className="flex items-baseline justify-between gap-3">
          <span id={labelId} className="text-base font-medium text-strong">
            {label}
          </span>
          <span className="text-small font-medium text-strong tabular-nums">
            {warn ? <span className="mr-2 text-warning">{warnText}</span> : null}
            {format(used)} <span className="text-muted">/ {format(max)}</span>
          </span>
        </div>
        {bar}
        <ul aria-label={`${label} dağılımı`} className="flex flex-wrap gap-x-4 gap-y-1.5">
          {legend}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <span id={labelId} className="text-base font-semibold text-strong">
          {label}
        </span>
        {warn ? (
          <span className="rounded-full bg-warning-fill px-2.5 py-0.5 text-small font-semibold text-on-warning-fill">{warnText}</span>
        ) : null}
      </div>
      <p aria-hidden className="-mt-2 flex items-baseline gap-2">
        <span className="text-display font-semibold text-strong tabular-nums">{format(active ? active.value : used)}</span>
        <span className="text-base text-muted">{active ? active.label : `/ ${format(max)}`}</span>
      </p>
      {bar}
      <ul aria-label={`${label} dağılımı`} className="flex flex-wrap gap-2">
        {legend}
      </ul>
    </div>
  );
}
