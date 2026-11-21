"use client";

import { Plus, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { FilterChip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

/**
 * Kayıtlı görünümler: bir listenin sık kullanılan süzgeç + sıralama birleşimi
 * ("Bugün aranacaklar", "Haberleşmesi kesik sayaçlar") tek tıkla çip olarak.
 * Sabit görünümler (`builtin`) kaldırılamaz; kullanıcının kaydettiği görünüm
 * sağdaki × ile silinir. "Görünümü Kaydet" satır içinde bir ad alanı açar:
 * Enter kaydeder, Esc vazgeçer.
 *
 * NE ZAMAN: günlük işi hep aynı süzgeçle başlayan roller (tahsilat uzmanı,
 * okuma sorumlusu). Süzgeci sıfırdan kurmak için `filter-sheet.tsx`, seçili
 * süzgeçleri göstermek ve geri almak için `active-filters.tsx`.
 *
 * DURUM ÇAĞIRANDA: `value` seçili görünümün kimliği, `onValueChange` seçim,
 * `onSave(ad)` şu anki süzgeçleri o adla kaydet (kimliği çağıran üretir),
 * `onDelete(id)`. Görünümün neyi içerdiğini bileşen bilmez; süzgeçleri
 * görünüme çevirmek çağıranın işi.
 *
 * KAYIT ADI: boş olamaz, en çok `maxLength` (varsayılan 32), mevcut bir
 * görünümle aynı olamaz (Türkçe büyük/küçük harf farkı yok sayılır: "Işık" =
 * "ışık"); hata `role="alert"` ile yazılır, alan `aria-invalid`.
 *
 * ERİŞİLEBİLİRLİK: kap `role="group"` + ad; her görünüm basılı/değil butonu
 * (`aria-pressed`, seçili görünüm ✓ ile de belli). Silme butonu adı
 * "Sil: Bugün Aranacaklar". Silince odak "Görünümü Kaydet" butonune döner.
 * Kaydet alanı açılınca odak alana gider, kapanınca butona döner.
 * İçine etkileşimli öğe koyma: bileşen yalnız buton ve alan taşır.
 *
 *   <SavedViews
 *     views={[{ id: "hepsi", label: "Hepsi", builtin: true }, { id: "v1", label: "Bugün Aranacaklar", count: 14 }]}
 *     value={view}
 *     onValueChange={setView}
 *     onSave={(name) => addView(name)}
 *     onDelete={removeView}
 *   />
 */

export type SavedView = {
  id: string;
  label: string;
  /** Görünümün sonuç sayısı (isteğe bağlı). */
  count?: number;
  /** Sabit görünüm: silinemez. */
  builtin?: boolean;
};

type SavedViewsProps = {
  views: readonly SavedView[];
  value: string;
  onValueChange: (id: string) => void;
  onSave?: (name: string) => void;
  onDelete?: (id: string) => void;
  label?: string;
  saveLabel?: string;
  maxLength?: number;
  className?: string;
};

const fold = (value: string) => value.trim().toLocaleLowerCase("tr-TR");

export function SavedViews({
  views,
  value,
  onValueChange,
  onSave,
  onDelete,
  label = "Kayıtlı Görünümler",
  saveLabel = "Görünümü Kaydet",
  maxLength = 32,
  className,
}: SavedViewsProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const errorId = useId();

  const close = () => {
    setAdding(false);
    setName("");
    setError(null);
    // Alan kaybolurken odak kaybolmasın.
    requestAnimationFrame(() => saveRef.current?.focus());
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Görünüme bir ad ver.");
    if (clean.length > maxLength) return setError(`Ad en çok ${maxLength} karakter olabilir.`);
    if (views.some((v) => fold(v.label) === fold(clean))) return setError("Bu adla bir görünüm zaten var.");
    onSave?.(clean);
    close();
  };

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {views.map((view) => {
        const deletable = !!onDelete && !view.builtin;
        return (
          <span key={view.id} className="inline-flex items-center">
            <FilterChip selected={view.id === value} count={view.count} onClick={() => onValueChange(view.id)} className={deletable ? "rounded-r-none border-r-0 pr-2.5" : undefined}>
              {view.label}
            </FilterChip>
            {deletable ? (
              <button
                type="button"
                aria-label={`Sil: ${view.label}`}
                onClick={() => {
                  onDelete?.(view.id);
                  requestAnimationFrame(() => saveRef.current?.focus());
                }}
                className="grid min-h-11 w-9 cursor-pointer place-items-center rounded-r-full border border-l-0 border-line bg-overlay text-muted shadow-raised outline-none hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-line-focus pointer-fine:min-h-8"
              >
                <X aria-hidden className="size-3.5" strokeWidth={2.5} />
              </button>
            ) : null}
          </span>
        );
      })}

      {onSave ? (
        adding ? (
          <form onSubmit={submit} className="inline-flex items-center gap-1.5" noValidate>
            <label className="sr-only" htmlFor={`${errorId}-name`}>
              Görünüm adı
            </label>
            <input
              id={`${errorId}-name`}
              ref={(el) => {
                inputRef.current = el;
                el?.focus();
              }}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  close();
                }
              }}
              placeholder="Görünüm adı"
              maxLength={maxLength + 8}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "min-h-11 w-44 rounded-md border bg-overlay px-3 text-base text-strong shadow-raised outline-none placeholder:text-muted focus-visible:border-line-focus pointer-fine:min-h-8",
                error ? "border-danger" : "border-line",
              )}
            />
            <button type="submit" className="min-h-11 cursor-pointer rounded-md bg-cta px-3 text-base font-semibold text-on-brand shadow-cta pointer-fine:min-h-8">
              Kaydet
            </button>
            <button type="button" onClick={close} className="min-h-11 cursor-pointer rounded-md px-2 text-base font-medium text-muted hover:text-strong pointer-fine:min-h-8">
              Vazgeç
            </button>
            {error ? (
              <span id={errorId} role="alert" className="basis-full text-small text-danger">
                {error}
              </span>
            ) : null}
          </form>
        ) : (
          <button
            ref={saveRef}
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-dashed border-line-strong px-3 text-base font-medium text-muted outline-none hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-line-focus pointer-fine:min-h-8"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
            {saveLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
