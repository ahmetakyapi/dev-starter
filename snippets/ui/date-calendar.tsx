"use client";

import { m, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Ay takvimi: tek gün ya da tarih ARALIĞI seçimi, satır içi (rezervasyon
 * paneli, filtre kenar çubuğu). Alan + açılır kutu isteniyorsa
 * `date-picker.tsx` bunu sarar. Doğum tarihi gibi yıllar öncesine gidilen
 * değer için takvim yanlış araç: üç alanlı metin girişi daha hızlı.
 *
 * Hafta PAZARTESİ başlar (tr-TR), ay ve gün adları `Intl`den. Izgara her
 * ay 6 satır: ay değişince yükseklik zıplamaz, açılır kutu yer değiştirmez.
 * Komşu ayların günleri soluk ama seçilebilir.
 *
 * ARALIK GÖRÜNÜŞÜ: uçlar dolgulu daire (`bg-primary`), aradaki günler
 * `primary-wash` şeritte. Şerit hücre ortasından başlar, hafta sonunda
 * yuvarlanır ve bir sonraki satırda yeniden açılır; böylece haftayı
 * aşan aralık kesik değil satır satır okunur. İlk tıklama başlangıç,
 * ikincisi bitiş (öncesine tıklanırsa yer değiştirir); arada fareyle ya da
 * klavyeyle gezilen gün aralığı önizler.
 *
 * Klavye (WAI-ARIA grid, APG tarih seçici): ←/→ gün, ↑/↓ hafta, Home/End
 * haftanın başı/sonu, PageUp/PageDown ay, Shift+PageUp/PageDown yıl,
 * Enter/Space seç. Tek sekme durağı (gezici tabindex); odak ayı aşarsa ay
 * döner. Ay başlığı canlı bölge: önceki/sonraki düğmesi ayı söyletir.
 * Bugün `aria-current="date"` + altta nokta; devre dışı gün odaklanır ama
 * seçilmez (`aria-disabled`), klavye kullanıcısı onu atlamak zorunda kalmaz.
 *
 * "Bugün" yalnız tarayıcıda hesaplanır (`useSyncExternalStore`, sunucuda
 * boş): sunucu UTC'de, kullanıcı İstanbul'da olunca gece yarısı ayrışıp
 * hidrasyon hatası vermesin.
 */

export type DateRange = { start: Date; end: Date | null };

type CommonProps = {
  /** Izgaranın ekran okuyucu adı öneki: "Giriş Tarihi". */
  label?: string;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  /** İlk görünen ay; verilmezse seçim ya da bugün. Sunucu çizimi için verin. */
  defaultMonth?: Date;
  /** Açılınca seçili (ya da bugünkü) güne odaklan: açılır kutu içinde. */
  autoFocus?: boolean;
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

export type DateCalendarProps = SingleProps | RangeProps;

const LOCALE = "tr-TR";
const monthName = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" });
const dayName = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
// 1 Ocak 2024 Pazartesi: haftanın adları buradan.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(2024, 0, 1 + i);
  return {
    short: new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(date),
    long: new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(date),
  };
});

const day = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
function addMonths(date: Date, n: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
}
const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const weekday = (date: Date) => (date.getDay() + 6) % 7; // Pazartesi = 0
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const subscribe = () => () => {};
function useTodayKey() {
  return useSyncExternalStore(
    subscribe,
    () => key(new Date()),
    () => null,
  );
}

export function DateCalendar(props: DateCalendarProps) {
  const { label, min, max, isDateDisabled, defaultMonth, autoFocus, className } = props;
  const isRange = props.mode === "range";
  const titleId = useId();
  const reduce = useReducedMotion();
  const tableRef = useRef<HTMLTableElement>(null);
  const pendingFocus = useRef(Boolean(autoFocus));
  const todayKey = useTodayKey();

  const [innerSingle, setInnerSingle] = useState<Date | null>(!isRange ? (props.defaultValue ?? null) : null);
  const [innerRange, setInnerRange] = useState<DateRange | null>(isRange ? (props.defaultValue ?? null) : null);
  const single = !isRange ? (props.value !== undefined ? props.value : innerSingle) : null;
  const range = isRange ? (props.value !== undefined ? props.value : innerRange) : null;

  const anchor = day(single ?? range?.start ?? defaultMonth ?? new Date());
  const [focused, setFocused] = useState<Date>(anchor);
  const [month, setMonth] = useState<Date>(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const [direction, setDirection] = useState(0);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [gridFocus, setGridFocus] = useState(false);

  const disabled = (date: Date) =>
    (min !== undefined && date < day(min)) || (max !== undefined && date > day(max)) || Boolean(isDateDisabled?.(date));

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    tableRef.current?.querySelector<HTMLButtonElement>(`[data-date="${key(focused)}"]`)?.focus();
  }, [focused, month]);

  function showMonth(next: Date) {
    const first = new Date(next.getFullYear(), next.getMonth(), 1);
    if (first.getTime() === month.getTime()) return;
    setDirection(first > month ? 1 : -1);
    setMonth(first);
  }

  function moveFocus(next: Date) {
    pendingFocus.current = true;
    setFocused(next);
    if (!sameMonth(next, month)) showMonth(next);
  }

  function pageMonth(n: number) {
    const next = addMonths(focused, n);
    setFocused(next);
    showMonth(next);
  }

  function select(date: Date) {
    if (disabled(date)) return;
    setFocused(date);
    if (!sameMonth(date, month)) showMonth(date);
    if (props.mode === "range") {
      const next: DateRange =
        !range || range.end !== null
          ? { start: date, end: null }
          : date < range.start
            ? { start: date, end: range.start }
            : { start: range.start, end: date };
      if (props.value === undefined) setInnerRange(next);
      props.onValueChange?.(next);
    } else {
      if (props.value === undefined) setInnerSingle(date);
      props.onValueChange?.(date);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekday(focused)),
      End: () => addDays(focused, 6 - weekday(focused)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      moveFocus(moves[event.key]());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(focused);
    }
  }

  // Görünen 6 hafta: ayın ilk gününün haftasının pazartesisinden.
  const first = addDays(month, -weekday(month));
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));

  // Aralık (ya da önizleme) uçları.
  const preview = range && range.end === null ? (hovered ?? (gridFocus ? focused : null)) : null;
  const [lo, hi] = (() => {
    if (!range) return [null, null];
    const end = range.end ?? preview;
    if (!end) return [range.start, range.start];
    return end < range.start ? [end, range.start] : [range.start, end];
  })();
  const previewing = Boolean(range && range.end === null && preview);

  const monthKey = key(month);

  return (
    <div className={cn("w-full max-w-[22rem] select-none", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Önceki Ay"
          onClick={() => pageMonth(-1)}
          className="grid size-11 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-8"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={2.25} />
        </button>
        <div id={titleId} aria-live="polite" className="text-base font-semibold text-strong first-letter:uppercase">
          {monthName.format(month)}
        </div>
        <button
          type="button"
          aria-label="Sonraki Ay"
          onClick={() => pageMonth(1)}
          className="grid size-11 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-8"
        >
          <ChevronRight aria-hidden className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      <table
        ref={tableRef}
        role="grid"
        aria-labelledby={label ? undefined : titleId}
        aria-label={label ? `${label}, ${monthName.format(month)}` : undefined}
        aria-multiselectable={isRange || undefined}
        onKeyDown={onKeyDown}
        onFocus={() => setGridFocus(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setGridFocus(false);
        }}
        onMouseLeave={() => setHovered(null)}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {WEEKDAYS.map((name) => (
              <th
                key={name.long}
                scope="col"
                abbr={name.long}
                className="pb-1 text-micro font-semibold text-muted"
              >
                {name.short}
              </th>
            ))}
          </tr>
        </thead>
        <m.tbody
          key={monthKey}
          initial={{ opacity: 0, x: reduce ? 0 : direction * 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
        >
          {weeks.map((week) => (
            <tr key={key(week[0])}>
              {week.map((date, col) => {
                const k = key(date);
                const outside = !sameMonth(date, month);
                const off = disabled(date);
                const isStart = lo !== null && k === key(lo);
                const isEnd = hi !== null && k === key(hi);
                const inBand = lo !== null && hi !== null && date >= lo && date <= hi && key(lo) !== key(hi);
                // Dolgu yalnız GERÇEK uçlarda; önizlenen uç şeritte kalır.
                const filled = single
                  ? k === key(single)
                  : range !== null && (k === key(range.start) || (range.end !== null && k === key(range.end)));
                const selected = single
                  ? k === key(single)
                  : Boolean(range && !previewing && lo && hi && date >= lo && date <= hi);
                return (
                  <td key={k} role="gridcell" aria-selected={selected} className="relative p-0 py-0.5 text-center">
                    {inBand ? (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-y-0.5 bg-primary-wash",
                          isStart ? "left-1/2" : "left-0",
                          isEnd ? "right-1/2" : "right-0",
                          col === 0 && !isStart && "left-1 rounded-l-full",
                          col === 6 && !isEnd && "right-1 rounded-r-full",
                          previewing && "opacity-60",
                        )}
                      />
                    ) : null}
                    <button
                      type="button"
                      data-date={k}
                      tabIndex={k === key(focused) ? 0 : -1}
                      aria-label={dayName.format(date)}
                      aria-current={k === todayKey ? "date" : undefined}
                      aria-disabled={off || undefined}
                      onClick={() => select(date)}
                      onMouseEnter={() => isRange && setHovered(date)}
                      className={cn(
                        "relative mx-auto grid size-11 place-items-center rounded-full text-base tabular-nums transition-[background-color,color,scale] duration-150 pointer-fine:size-9",
                        "[&:focus-visible]:outline-offset-0",
                        filled
                          ? "bg-primary font-semibold text-on-primary shadow-raised"
                          : inBand
                            ? "font-medium text-primary-ink hover:bg-primary-wash"
                            : "text-strong hover:bg-surface-raised",
                        outside && !filled && !inBand && "text-muted",
                        off && "cursor-not-allowed text-muted line-through decoration-line-strong opacity-50 hover:bg-transparent",
                        !off && "active:scale-95 motion-reduce:active:scale-100",
                      )}
                    >
                      {date.getDate()}
                      {k === todayKey ? (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                            filled ? "bg-on-primary" : "bg-primary",
                          )}
                        />
                      ) : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </m.tbody>
      </table>
    </div>
  );
}
