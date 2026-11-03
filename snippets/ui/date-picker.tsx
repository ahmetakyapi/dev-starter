"use client";

import { CalendarDays } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Tarih alanı: formda tek satır yer kaplayan, tıklayınca açılır kutuda
 * `date-calendar.tsx` gösteren seçici (randevu günü, rapor aralığı).
 * Takvim sayfada sürekli görünecekse doğrudan `DateCalendar`.
 *
 * Açılır kutu Base UI (`popover.tsx`): dış tıklama ve Escape kapatır, odak
 * tetikleyiciye döner. Açılınca odak takvimin SEÇİLİ gününe gider (ilk
 * düğmeye, "Önceki Ay"a değil): klavye kullanıcısı oklarla hemen gezer.
 * Tek günde seçim kutuyu kapatır; aralıkta bitiş günü seçilince kapanır.
 *
 * Tetikleyicinin adı "etiket + değer": ekran okuyucu "Giriş Tarihi,
 * 12 Kas 2026, düğme" der. Aralık `Intl.DateTimeFormat#formatRange` ile
 * yazılır ("12–18 Kas 2026"); ay ve yıl tekrarlanmaz.
 *
 * Form: `name` verilince gizli giriş `YYYY-AA-GG` taşır; aralıkta iki
 * giriş (`<name>-start`, `<name>-end`). Saat dilimi yok: gün takvim
 * günüdür, sunucu onu UTC gece yarısına çevirmemeli.
 *
 *   <DatePicker label="Teslim Tarihi" min={new Date()} name="teslim" />
 *   <DatePicker mode="range" label="Konaklama" placeholder="Giriş – Çıkış" />
 */

type CommonProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  defaultMonth?: Date;
  name?: string;
  disabled?: boolean;
  className?: string;
};

type SingleProps = CommonProps & {
  mode?: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
};

type RangeProps = CommonProps & {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange) => void;
};

const display = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function DatePicker(props: SingleProps | RangeProps) {
  const { label, hint, error, placeholder = "Tarih Seçin", min, max, isDateDisabled, defaultMonth, name, disabled, className } = props;
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const [open, setOpen] = useState(false);

  const isRange = props.mode === "range";
  const [single, setSingle] = useState<Date | null>(!isRange ? (props.defaultValue ?? null) : null);
  const [range, setRange] = useState<DateRange | null>(isRange ? (props.defaultValue ?? null) : null);
  const currentSingle = !isRange ? (props.value !== undefined ? props.value : single) : null;
  const currentRange = isRange ? (props.value !== undefined ? props.value : range) : null;

  const text = currentSingle
    ? display.format(currentSingle)
    : currentRange
      ? currentRange.end
        ? display.formatRange(currentRange.start, currentRange.end)
        : `${display.format(currentRange.start)} – …`
      : null;

  const common = { label: typeof label === "string" ? label : undefined, min, max, isDateDisabled, defaultMonth, autoFocus: true };

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <span id={labelId} className="text-small font-semibold text-strong">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-describedby={describedBy}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line-strong bg-surface-sunken shadow-well px-3 text-left text-base transition-[color,background-color,border-color,box-shadow]",
            "hover:border-primary-soft focus-visible:border-line-focus focus-visible:shadow-focus focus-visible:outline-offset-0 data-popup-open:border-line-focus disabled:opacity-50",
            error && "border-danger",
          )}
        >
          <span id={valueId} className={cn("truncate tabular-nums", text ? "text-strong" : "text-muted")}>
            {text ?? placeholder}
          </span>
          <CalendarDays aria-hidden className="size-4 shrink-0 text-muted" />
        </PopoverTrigger>
        <PopoverContent align="start" initialFocus={false} aria-labelledby={labelId} className="w-auto p-3">
          {props.mode === "range" ? (
            <DateCalendar
              {...common}
              mode="range"
              value={currentRange}
              onValueChange={(next) => {
                if (props.value === undefined) setRange(next);
                props.onValueChange?.(next);
                if (next.end) setOpen(false);
              }}
            />
          ) : (
            <DateCalendar
              {...common}
              value={currentSingle}
              onValueChange={(next) => {
                if (props.value === undefined) setSingle(next);
                props.onValueChange?.(next);
                setOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      {name && currentSingle ? <input type="hidden" name={name} value={iso(currentSingle)} /> : null}
      {name && currentRange ? (
        <>
          <input type="hidden" name={`${name}-start`} value={iso(currentRange.start)} />
          {currentRange.end ? <input type="hidden" name={`${name}-end`} value={iso(currentRange.end)} /> : null}
        </>
      ) : null}
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
