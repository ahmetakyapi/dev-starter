"use client";

import { Star } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Yıldız puanlama, iki parça:
 *  - `Rating`: GÖSTERİM (ürün kartı, yorum başlığı). Tek bir `role="img"`,
 *    adı "5 üzerinden 4,5 puan"; yıldızlar tek tek okunmaz. Yarım yıldız
 *    çizilir (değer en yakın yarıma yuvarlanır, sözdeki sayı tam değer).
 *  - `RatingInput`: GİRİŞ (yorum formu, memnuniyet anketi). Görünmez YEREL
 *    radyo düğmeleri: ok tuşları, Tab'ın gruba bir kez girmesi, form
 *    gönderimi ve `required` tarayıcıdan gelir, JS'siz de çalışır. Kap
 *    `role="radiogroup"` + etiket bağı; her seçeneğin adı "5 üzerinden 4
 *    yıldız" (+ verilmişse sözlü karşılığı: "İyi").
 *
 * NEDEN SLIDER DEĞİL: 5 ayrık seçenek bir radyo grubudur; slider sürekli
 * aralık söyler, ekran okuyucu "yüzde 80" der. Yarım adımda (`allowHalf`)
 * 10 radyo olur: her yıldızın sol ve sağ yarısı ayrı hedef, ok tuşu yarım
 * yarım ilerler.
 *
 * TEMİZLEME: seçili yıldıza yeniden tıklamak (ya da Boşluk) seçimi kaldırır;
 * `clearable={false}` kapatır. Fare yıldızların üstündeyken önizleme
 * dolgusu ve sözlü karşılık güncellenir, ayrılınca seçili değere döner.
 *
 * RENK: dolu yıldız `accent-warm` (pirinç; markanın sıcak vurgusu, durum
 * rengi değil), boş yıldız gösterimde soluk `chart-track`, girişte
 * `text-muted` dış çizgi: denetimin sınırı zemine karşı ≥ 3:1 olmalı
 * (WCAG 1.4.11), gösterimde değer zaten sözde.
 *
 * DOKUNMATİK: girişte her yıldız 44 px hedef (`pointer-fine:` ile 32);
 * gösterim boyları 16/20/28.
 *
 *   <Rating value={4.6} count={1284} showValue />
 *   <RatingInput label="Puanın" name="puan" labels={["Çok Kötü", "Kötü", "Orta", "İyi", "Mükemmel"]} />
 */

const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

const GLYPH = { sm: "size-4", md: "size-5", lg: "size-7" } as const;

/** Tek yıldız; `fill` 0–1 arası (0,5 yarım). */
function StarGlyph({ fill, size, tone }: { fill: number; size: string; tone: "display" | "input" }) {
  return (
    <span aria-hidden className={cn("relative inline-grid shrink-0", size)}>
      <Star
        className={cn(
          "col-start-1 row-start-1 size-full",
          tone === "display" ? "fill-chart-track text-chart-track" : "fill-transparent text-muted",
        )}
        strokeWidth={1.75}
      />
      <Star
        className="col-start-1 row-start-1 size-full fill-accent-warm text-accent-warm transition-[clip-path] duration-150"
        strokeWidth={1.75}
        style={{ clipPath: `inset(0 ${100 - Math.max(0, Math.min(1, fill)) * 100}% 0 0)` }}
      />
    </span>
  );
}

type RatingProps = {
  value: number;
  max?: number;
  size?: keyof typeof GLYPH;
  /** Yanında "4,6". */
  showValue?: boolean;
  /** Yanında "(1.284)" ve adda "1.284 değerlendirme". */
  count?: number;
  className?: string;
};

export function Rating({ value, max = 5, size = "md", showValue = false, count, className }: RatingProps) {
  const shown = Math.round(Math.min(max, Math.max(0, value)) * 2) / 2;
  const name =
    `${max} üzerinden ${fmt(value)} puan` + (count !== undefined ? `, ${count.toLocaleString("tr-TR")} değerlendirme` : "");

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span role="img" aria-label={name} className="inline-flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => (
          <StarGlyph key={index} fill={shown - index} size={GLYPH[size]} tone="display" />
        ))}
      </span>
      {showValue ? (
        <span aria-hidden className={cn("font-semibold text-strong tabular-nums", size === "lg" ? "text-base" : "text-small")}>
          {fmt(value)}
        </span>
      ) : null}
      {count !== undefined ? (
        <span aria-hidden className="text-small text-muted tabular-nums">
          ({count.toLocaleString("tr-TR")})
        </span>
      ) : null}
    </span>
  );
}

type RatingInputProps = {
  label: ReactNode;
  /** Etiketi gözden gizle (ekran okuyucuda kalır). */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string;
  name?: string;
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  max?: number;
  allowHalf?: boolean;
  clearable?: boolean;
  /** Her tam yıldızın sözlü karşılığı, 1'den başlayarak. */
  labels?: readonly string[];
  size?: "md" | "lg";
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
};

const INPUT_GLYPH = { md: "size-6", lg: "size-8" } as const;

export function RatingInput({
  label,
  hideLabel = false,
  hint,
  error,
  name,
  value,
  defaultValue = null,
  onValueChange,
  max = 5,
  allowHalf = false,
  clearable = true,
  labels,
  size = "md",
  required,
  disabled,
  readOnly,
  className,
}: RatingInputProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const groupName = name ?? `${id}-rating`;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const current = value === undefined ? inner : value;
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? current ?? 0;
  const word = display > 0 ? labels?.[Math.ceil(display) - 1] : undefined;
  const locked = disabled || readOnly;

  function commit(next: number | null) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  const optionName = (v: number) => {
    const extra = labels?.[Math.ceil(v) - 1];
    return `${max} üzerinden ${fmt(v)} yıldız${extra ? `, ${extra}` : ""}`;
  };

  const option = (v: number, half: "left" | "right" | null) => (
    <label
      key={v}
      onPointerEnter={() => !locked && setHover(v)}
      className={cn(
        "absolute inset-y-0 cursor-pointer",
        half === "left" ? "left-0 w-1/2" : half === "right" ? "right-0 w-1/2" : "inset-x-0",
        locked && "cursor-default",
      )}
    >
      <input
        type="radio"
        name={groupName}
        value={v}
        checked={current === v}
        required={required}
        disabled={disabled}
        // Salt okunur radyo yok: değişikliği yut, odak ve okuma kalsın.
        onChange={() => !readOnly && commit(v)}
        onClick={() => {
          if (!readOnly && clearable && current === v) commit(null);
        }}
        className="sr-only"
      />
      <span className="sr-only">{optionName(v)}</span>
    </label>
  );

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <span id={labelId} className={cn("text-small font-semibold text-strong", hideLabel && "sr-only")}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          onPointerLeave={() => setHover(null)}
          className={cn("-mx-2.5 inline-flex pointer-fine:-mx-1", disabled && "opacity-50")}
        >
          {Array.from({ length: max }, (_, index) => {
            const whole = index + 1;
            return (
              <span
                key={whole}
                className={cn(
                  "relative grid place-items-center rounded-md p-2.5 pointer-fine:p-1",
                  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-0 has-[input:focus-visible]:outline-line-focus",
                  !locked && "motion-safe:transition-[scale] motion-safe:duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-95",
                )}
              >
                <StarGlyph fill={display - index} size={INPUT_GLYPH[size]} tone="input" />
                {allowHalf ? [option(whole - 0.5, "left"), option(whole, "right")] : option(whole, null)}
              </span>
            );
          })}
        </div>
        <span aria-hidden className="min-h-5 text-small font-medium text-muted tabular-nums">
          {display > 0 ? (word ?? `${fmt(display)} / ${max}`) : null}
        </span>
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
