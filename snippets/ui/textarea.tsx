"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Çok satırlı metin: not, açıklama, geri bildirim. Tek satırlık değer
 * için `Field` (input).
 *
 * İÇERİĞE GÖRE BÜYÜR: `field-sizing: content` (Chrome 123+, Safari 26+)
 * alanı yazdıkça uzatır, `minRows`/`maxRows` sınırı tutar, sınırdan sonra
 * kaydırır. Desteklemeyen tarayıcıda (Firefox) aynı işi küçük bir yedek
 * yapar: `scrollHeight` okunur, yükseklik yazılır. Tek kaynak CSS; yedek
 * yalnızca desteği yoksa bağlanır.
 *
 * SAYAÇ: `maxLength` verilince köşede "182 / 280". %90'a gelince
 * `warning`, sınırda `danger` rengine döner ve RENK TEK İŞARET DEĞİL:
 * aynı anda gizli canlı bölge "Karakter sınırına yaklaşıldı" der. Metin
 * sabit, bölge yalnız eşik geçilince konuşur; sayıyı her tuşta okusaydı
 * ekran okuyucu yazarken susmazdı (kalan sayı sayaçta, alana bağlı).
 *
 * Diğer her `textarea` özelliği (`name`, `required`, `defaultValue`…)
 * olduğu gibi geçer; JS'siz form gönderimi bozulmaz.
 *
 *   <Textarea label="Teslimat Notu" maxLength={280} minRows={3}
 *     hint="Kapı kodu, kat, zil adı gibi kurye için bilgiler." />
 */

type TextareaProps = Omit<ComponentProps<"textarea">, "id" | "rows"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  minRows?: number;
  maxRows?: number;
  /** Uyarı renginin başladığı doluluk oranı. */
  warnAt?: number;
};

const LINE = 22; // text-base satır yüksekliği (1.375rem), piksel
const PAD = 22; // py-2.5 + kenarlık

export function Textarea({
  label,
  hint,
  error,
  minRows = 3,
  maxRows = 10,
  warnAt = 0.9,
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: TextareaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [length, setLength] = useState(() => String(value ?? defaultValue ?? "").length);
  const shown = value === undefined ? length : String(value).length;

  const ratio = maxLength ? shown / maxLength : 0;
  const level = !maxLength ? "none" : shown >= maxLength ? "full" : ratio >= warnAt ? "warn" : "ok";
  const describedBy = [error ? errorId : hint ? hintId : null, maxLength ? countId : null].filter(Boolean).join(" ") || undefined;

  // Yedek büyüme: yalnız `field-sizing` desteklenmiyorsa.
  useEffect(() => {
    const node = ref.current;
    if (!node || CSS.supports("field-sizing", "content")) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, maxRows * LINE + PAD)}px`;
  }, [shown, maxRows]);

  const announce =
    level === "full" ? "Karakter sınırına ulaşıldı" : level === "warn" ? "Karakter sınırına yaklaşıldı" : "";

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-strong">
        {label}
      </label>
      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          style={{ minHeight: minRows * LINE + PAD, maxHeight: maxRows * LINE + PAD }}
          className={cn(
            "block w-full resize-none rounded-md border border-line-strong bg-surface-sunken px-3 py-2.5 text-base text-strong [field-sizing:content]",
            "transition-colors placeholder:text-muted hover:border-primary-soft focus-visible:border-line-focus focus-visible:outline-offset-0",
            maxLength && "pb-7",
            error && "border-danger",
          )}
          {...props}
        />
        {maxLength ? (
          <span
            id={countId}
            className={cn(
              "pointer-events-none absolute right-3 bottom-2 rounded-full px-1.5 text-micro font-semibold tabular-nums transition-colors",
              level === "ok" && "text-muted",
              // Wash zeminsiz: wash + gri kuyu + alan zemini üst üste binince 4,41:1 (AA altı).
              level === "warn" && "text-warning",
              level === "full" && "bg-danger-wash text-danger",
            )}
          >
            <span className="sr-only">Karakter sayısı: </span>
            {shown.toLocaleString("tr-TR")} / {maxLength.toLocaleString("tr-TR")}
          </span>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {announce}
      </span>
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
