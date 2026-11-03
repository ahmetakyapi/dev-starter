"use client";

import { Clock } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Saat alanı: 24 saatlik SS:DD (randevu saati, mesai başlangıcı). Türkiye
 * 24 saat yazar; ÖÖ/ÖS bölümü yok. Saat bir listeden seçilecekse (yarım
 * saatlik boş randevular) `select.tsx` daha az tuş ister.
 *
 * NEDEN SEGMENT: yerel `<input type="time">` tarayıcıdan tarayıcıya başka
 * çizilir, koyu temaya uymaz ve iOS'ta tekerlek açar. Burada iki
 * `role="spinbutton"` segment var (react-aria'nın tarih alanı kalıbı):
 *   ↑/↓ bir artırır (dakikada `minuteStep`), PageUp/PageDown saatte 3,
 *   dakikada 15; Home/End uçlar; değer sarılır (23 → 00).
 *   Rakam yazmak doğrudan doldurur: "9" yazınca 09 olur ve dakikaya
 *   geçer, "1" yazınca ikinci rakamı bekler ("14"). ←/→ ve ":" segment
 *   değiştirir, Backspace segmenti boşaltır.
 * Tek sekme durağı değil, iki: her segment ayrı denetim, Tab da gezer.
 *
 * Değer `"HH:MM"` ya da yarım kalmışsa `null`; formda gizli giriş
 * (`name`) aynı biçimi gönderir.
 *
 *   <TimeField label="Randevu Saati" defaultValue="14:30" minuteStep={5} name="saat" />
 */

type TimeFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  minuteStep?: number;
  name?: string;
  disabled?: boolean;
  className?: string;
};

type Parts = { h: number | null; m: number | null };
type Segment = "h" | "m";

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string | null | undefined): Parts {
  const match = value ? /^(\d{1,2}):(\d{2})$/.exec(value) : null;
  if (!match) return { h: null, m: null };
  return { h: Math.min(23, Number(match[1])), m: Math.min(59, Number(match[2])) };
}

const format = (parts: Parts) => (parts.h === null || parts.m === null ? null : `${pad(parts.h)}:${pad(parts.m)}`);

export function TimeField({
  label,
  hint,
  error,
  value,
  defaultValue,
  onValueChange,
  minuteStep = 1,
  name,
  disabled,
  className,
}: TimeFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const [inner, setInner] = useState<Parts>(() => parse(defaultValue));
  // Denetimli kullanımda yarım değer (`null`) dışarı çıkmaz; yarım giriş
  // içeride kalır, tam olunca bildirilir.
  const external = value === undefined ? null : parse(value);
  const parts = external && format(external) !== null && format(inner) !== format(external) ? external : inner;
  const refs = { h: useRef<HTMLSpanElement>(null), m: useRef<HTMLSpanElement>(null) };
  const typed = useRef<string>("");

  function update(next: Parts) {
    setInner(next);
    const text = format(next);
    if (text !== format(parts)) onValueChange?.(text);
  }

  const max = { h: 23, m: 59 } as const;
  const wrap = (n: number, seg: Segment) => ((n % (max[seg] + 1)) + max[seg] + 1) % (max[seg] + 1);

  function focusSegment(seg: Segment) {
    typed.current = "";
    refs[seg].current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>, seg: Segment) {
    if (disabled) return;
    const current = parts[seg];
    const step = seg === "m" ? minuteStep : 1;
    const page = seg === "m" ? 15 : 3;
    const set = (n: number) => update({ ...parts, [seg]: n });
    const base = current ?? (seg === "h" ? new Date().getHours() : 0);

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        set(current === null ? base : wrap(current + step - (current % step), seg));
        break;
      case "ArrowDown":
        event.preventDefault();
        set(current === null ? base : wrap(current - (current % step || step), seg));
        break;
      case "PageUp":
        event.preventDefault();
        set(wrap(base + page, seg));
        break;
      case "PageDown":
        event.preventDefault();
        set(wrap(base - page, seg));
        break;
      case "Home":
        event.preventDefault();
        set(0);
        break;
      case "End":
        event.preventDefault();
        set(max[seg]);
        break;
      case "ArrowRight":
      case ":":
      case ".":
        event.preventDefault();
        if (seg === "h") focusSegment("m");
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (seg === "m") focusSegment("h");
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        typed.current = "";
        update({ ...parts, [seg]: null });
        break;
      default:
        if (/^\d$/.test(event.key)) {
          event.preventDefault();
          const buffer = typed.current + event.key;
          const n = Number(buffer);
          // İkinci rakam bu segmenti aşacaksa ilk rakam tek başına yeter.
          const done = buffer.length === 2 || n * 10 > max[seg];
          set(Math.min(n, max[seg]));
          typed.current = done ? "" : buffer;
          if (done && seg === "h") focusSegment("m");
        }
    }
  }

  const segment = (seg: Segment, labelText: string) => {
    const current = parts[seg];
    return (
      <span
        ref={refs[seg]}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={labelText}
        aria-valuemin={0}
        aria-valuemax={max[seg]}
        aria-valuenow={current ?? undefined}
        aria-valuetext={current === null ? "Boş" : pad(current)}
        aria-disabled={disabled || undefined}
        aria-invalid={error ? true : undefined}
        inputMode="numeric"
        onKeyDown={(event) => onKeyDown(event, seg)}
        onFocus={() => {
          typed.current = "";
        }}
        className={cn(
          "rounded-sm px-1 py-0.5 tabular-nums caret-transparent outline-none transition-colors",
          // Dolgu: alan zemininde wash + ink 4,27:1 kalıyordu; primary/on-primary AA (testli).
          "focus:bg-primary focus:text-on-primary",
          current === null ? "text-muted" : "text-strong",
        )}
      >
        {current === null ? "––" : pad(current)}
      </span>
    );
  };

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <span id={labelId} onClick={() => focusSegment("h")} className="w-fit text-small font-semibold text-strong">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        onClick={(event) => {
          if (event.target === event.currentTarget) focusSegment(parts.h === null ? "h" : "m");
        }}
        className={cn(
          "flex min-h-11 w-full max-w-40 cursor-text items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-sunken shadow-well px-2 text-base font-semibold transition-[color,background-color,border-color,box-shadow]",
          "hover:border-primary-soft has-focus:border-line-focus has-focus:shadow-focus",
          error && "border-danger",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex items-center">
          {segment("h", "Saat")}
          <span aria-hidden className="px-0.5 text-muted">
            :
          </span>
          {segment("m", "Dakika")}
        </span>
        <Clock aria-hidden className="size-4 shrink-0 text-muted" />
      </div>
      {name ? <input type="hidden" name={name} value={format(parts) ?? ""} /> : null}
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
