"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Tarih aralığı filtresi: hazır aralıklar ("Son 7 Gün", "Son 30 Gün",
 * "Tümü") ve aynı açılır kutuda özel aralık takvimi. Liste ve rapor
 * filtreleri için: insanların çoğu "son 30 gün" ister, takvimde iki gün
 * tıklamak zorunda kalmamalı; ama tam aralık gerekince ikinci bir
 * bileşene de gitmemeli.
 *
 * NE ZAMAN DEĞİL: formda tek bir tarih ya da aralık soruluyorsa
 * (`date-picker.tsx`); hazır aralığın anlamı yoksa (doğum tarihi).
 * Dönem karşılaştırmalı bir pano ("Hafta / Ay / Yıl") için
 * `segmented-control.tsx`: orada seçenek az ve hep görünür.
 *
 * Yöntem Assetora turundan (2026-11; davranış, kod değil). Onlarda hazır
 * menü ve takvim iki ayrı butondu; burada tek tetikleyici, çünkü ikisi
 * aynı değeri değiştiriyor ve iki buton "hangisi geçerli?" sorusu açıyordu.
 *
 * Değer `{ kind: "preset", id }` ya da `{ kind: "custom", start, end }`.
 * Filtreleme için `rangeOf(value, presets, today)` başlangıç ve bitişi verir
 * (`null`: sınırsız). `today` dışarıdan: sunucu ve istemci aynı günü
 * görsün, örnek veride sabit tarih kullanılabilsin.
 *
 * Erişilebilirlik: tetikleyicinin adı "etiket + değer"; hazır aralıklar
 * radyo grubu (ok tuşları, gezici tabindex), seçimde kutu kapanır ve odak
 * tetikleyiciye döner (Base UI Popover). Takvim `date-calendar.tsx`in
 * klavye davranışını taşır; bitiş günü seçilince değer uygulanır.
 *
 * Örnek:
 *   <DateRangePresets label="Geldi" presets={[{ id: "7", label: "Son 7 Gün", days: 7 },
 *     { id: "tum", label: "Tümü", days: null }]} value={v} onValueChange={setV} today={TODAY} />
 */

export type RangePreset = {
  id: string;
  label: string;
  /** Bugün dahil kaç gün geriye; `null`: sınırsız ("Tümü"). */
  days: number | null;
};

export type DateRangeValue = { kind: "preset"; id: string } | { kind: "custom"; start: Date; end: Date };

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Değerin kapsadığı gün aralığı (iki uç dahil, günün sonuna kadar); `null` sınırsız. */
export function rangeOf(value: DateRangeValue, presets: readonly RangePreset[], today: Date): { start: Date; end: Date } | null {
  if (value.kind === "custom") return { start: startOfDay(value.start), end: new Date(startOfDay(value.end).getTime() + DAY - 1) };
  const preset = presets.find((p) => p.id === value.id);
  if (!preset || preset.days === null) return null;
  const end = new Date(startOfDay(today).getTime() + DAY - 1);
  return { start: new Date(startOfDay(today).getTime() - (preset.days - 1) * DAY), end };
}

const rangeFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

type DateRangePresetsProps = {
  /** Tetikleyicinin etiketi: "Geldi", "Tarih". */
  label: string;
  presets: readonly RangePreset[];
  value: DateRangeValue;
  onValueChange: (value: DateRangeValue) => void;
  today: Date;
  /** Özel aralıkta seçilebilecek en geç gün; varsayılan `today`. */
  max?: Date;
  customLabel?: string;
  size?: "sm" | "md";
  className?: string;
};

export function DateRangePresets({
  label,
  presets,
  value,
  onValueChange,
  today,
  max = today,
  customLabel = "Özel Aralık",
  size = "md",
  className,
}: DateRangePresetsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | null>(value.kind === "custom" ? { start: value.start, end: value.end } : null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const shown =
    value.kind === "custom" ? rangeFormat.formatRange(value.start, value.end) : (presets.find((p) => p.id === value.id)?.label ?? presets[0]?.label);
  const current = value.kind === "preset" ? Math.max(0, presets.findIndex((p) => p.id === value.id)) : -1;

  const pick = (id: string) => {
    onValueChange({ kind: "preset", id });
    setDraft(null);
    setOpen(false);
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const from = current < 0 ? (step > 0 ? -1 : 0) : current;
    const next = (from + step + presets.length) % presets.length;
    onValueChange({ kind: "preset", id: presets[next].id });
    refs.current[next]?.focus();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-md bg-overlay px-3 text-base text-strong shadow-raised transition-shadow hover:shadow-floating [&_svg]:size-4 [&_svg]:shrink-0",
          size === "sm" && "text-small pointer-fine:min-h-9",
          className,
        )}
      >
        <CalendarDays aria-hidden className="text-muted" strokeWidth={1.75} />
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">{shown}</span>
        <ChevronDown aria-hidden className="text-muted" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(21rem,var(--available-width))] p-2">
        <div role="radiogroup" aria-label={`${label}: hazır aralıklar`} onKeyDown={onKey} className="grid gap-0.5">
          {presets.map((preset, i) => {
            const on = i === current;
            return (
              <button
                key={preset.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on || (current < 0 && i === 0) ? 0 : -1}
                onClick={() => pick(preset.id)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-md px-2.5 text-start text-base transition-colors pointer-fine:min-h-9",
                  on ? "bg-primary-wash font-medium text-primary-ink" : "text-body hover:bg-surface-raised hover:text-strong",
                )}
              >
                <span className="flex-1">{preset.label}</span>
                {on ? <Check aria-hidden className="size-4" strokeWidth={2.25} /> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-2 border-t border-line-soft px-1 pt-3">
          <p className="mb-1 flex items-baseline justify-between gap-2 px-1.5 text-small font-medium text-muted">
            {customLabel}
            {value.kind === "custom" ? <span className="font-semibold text-primary-ink tabular-nums">{shown}</span> : null}
          </p>
          <DateCalendar
            mode="range"
            label={`${label}: ${customLabel}`}
            max={max}
            defaultMonth={value.kind === "custom" ? value.start : today}
            value={draft}
            onValueChange={(range) => {
              setDraft(range);
              if (range.end) {
                onValueChange({ kind: "custom", start: range.start, end: range.end });
                setOpen(false);
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
