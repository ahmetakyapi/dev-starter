"use client";

import { NumberField as Base } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sayı alanı: kesin, küçük bir sayı (kişi sayısı, adet, gün). Değer
 * yaklaşıksa ve aralık genişse `slider.tsx`; telefon, posta kodu gibi
 * "sayı gibi görünen metin" için DÜZ metin alanı (`inputMode="numeric"`).
 *
 * Yazma, ok tuşları (Shift ×10), tekerlek, form gönderimi ve
 * `role="spinbutton"`-eşdeğeri ARIA Base UI'dan (`@base-ui/react/number-field`);
 * biçim `tr-TR` (binlik nokta, ondalık virgül: "1.250,5").
 *
 * BASILI TUTMA: Base UI ilk adımdan 400 ms sonra 60 ms aralıkla tekrarlar.
 * Üstüne biz HIZLANMA ekliyoruz: 1,2 saniyeden uzun basılı tutulunca her
 * tik 5 adım, 2,4 saniyeden sonra 10 adım. 0'dan 500'e varmak böylece
 * 30 saniye değil birkaç saniye sürer; tek dokunuş yine tek adımdır.
 *
 * Düğmeler beyaz karo (gri kuyunun içinde), dokunmatikte 44 px, ince
 * işaretçide 32 px. Sınırda düğme devre dışı kalır: "neden artmıyor?"
 * sorusunu görünüş cevaplar.
 *
 *   <NumberField label="Kişi Sayısı" defaultValue={2} min={1} max={12} />
 */

type NumberFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: Intl.NumberFormatOptions;
  /** Basılı tutunca hızlanma. */
  accelerate?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const HOLD_FAST = 1200;
const HOLD_FASTER = 2400;

export function NumberField({
  label,
  hint,
  error,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  format,
  accelerate = true,
  name,
  required,
  disabled,
  placeholder,
  className,
}: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const [inner, setInner] = useState<number | null>(defaultValue ?? null);
  const current = value === undefined ? inner : value;
  const holdStart = useRef<number | null>(null);

  function commit(next: number | null) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  const startHold = () => {
    holdStart.current = performance.now();
  };
  const endHold = () => {
    holdStart.current = null;
  };
  const holdProps = {
    onPointerDown: startHold,
    onPointerUp: endHold,
    onPointerLeave: endHold,
    onPointerCancel: endHold,
  };

  const button =
    "grid size-11 shrink-0 place-items-center rounded-sm bg-overlay text-strong shadow-raised transition-[background-color,color,scale] duration-150 select-none pointer-fine:size-8 hover:bg-page active:scale-95 motion-reduce:active:scale-100 data-disabled:bg-transparent data-disabled:text-muted data-disabled:shadow-none [&:focus-visible]:outline-offset-0";

  // *:min-w-0: Base UI kökü min-width:auto ile girdinin doğal genişliğine
  // (~300 px) uzanıp dar kolonda taşıyordu.
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5 *:min-w-0", className)}>
      <label htmlFor={id} className="text-small font-semibold text-strong">
        {label}
      </label>
      <Base.Root
        id={id}
        value={current}
        onValueChange={(next, details) => {
          const pressed = details.reason === "increment-press" || details.reason === "decrement-press";
          if (accelerate && pressed && holdStart.current !== null && next !== null && current !== null) {
            const held = performance.now() - holdStart.current;
            const factor = held > HOLD_FASTER ? 10 : held > HOLD_FAST ? 5 : 1;
            if (factor > 1) {
              const boosted = current + (next - current) * factor;
              commit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, boosted)));
              return;
            }
          }
          commit(next);
        }}
        min={min}
        max={max}
        step={step}
        format={format}
        locale="tr-TR"
        name={name}
        required={required}
        disabled={disabled}
      >
        <Base.Group
          className={cn(
            "flex w-full items-center gap-1 rounded-md border border-line-strong bg-surface-sunken p-1 transition-colors hover:border-primary-soft has-[input:focus-visible]:border-line-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-line-focus data-disabled:opacity-50",
            error && "border-danger",
          )}
        >
          <Base.Decrement aria-label="Azalt" className={button} {...holdProps}>
            <Minus aria-hidden className="size-4" strokeWidth={2.25} />
          </Base.Decrement>
          <Base.Input
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-roledescription="Sayı alanı"
            className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold text-strong tabular-nums outline-none placeholder:font-normal placeholder:text-muted"
          />
          <Base.Increment aria-label="Artır" className={button} {...holdProps}>
            <Plus aria-hidden className="size-4" strokeWidth={2.25} />
          </Base.Increment>
        </Base.Group>
      </Base.Root>
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
