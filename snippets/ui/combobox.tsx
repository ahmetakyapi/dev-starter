"use client";

import { Combobox as Base } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Aranabilir seçim: çok sayıda seçenekten biri (şehir, sembol, kişi).
 * Yazdıkça süzülür; seçenek listesi dışında değer kabul etmez. Serbest
 * metin girilebilen bir arama kutusu gerekiyorsa bu değil: Base UI
 * `Autocomplete`.
 *
 * Base UI Combobox: giriş `role="combobox"`, liste `listbox`, etkin öğe
 * `aria-activedescendant` ile (odak girişte kalır, yazmaya devam edilir),
 * ok tuşları, Enter ile seçim, Escape ile kapanma. Elle yazması en zor
 * kalıplardan biri; burada headless kütüphane tartışmasız.
 *
 * TÜRKÇE SÜZGEÇ: `locale="tr-TR"` karşılaştırmayı Türkçe yapar; "istanbul"
 * yazan "İstanbul"u, "ığdır" yazan "Iğdır"ı bulur. Varsayılan tarayıcının
 * dili ve İngilizce bir tarayıcıda "i" ile "İ" eşleşmez.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): giriş beyaz karo + kıl çizgisi, odakta
 * vurgu çizgisi ve yumuşak halka (`ring-primary-wash`). Liste `rounded-xl`
 * karo, `p-1.5`; vurgulu öğe yumuşak gri, seçili öğede SAĞDA tik.
 *
 * Sunucuda arama yapılacaksa (binlerce öğe) `filteredItems` ile sonuçları
 * dışarıdan ver ve `filter={null}`; Base UI belgesindeki "async" örneği.
 */

export type ComboboxItem = { value: string; label: string };

type ComboboxProps = {
  label: ReactNode;
  items: readonly ComboboxItem[];
  name?: string;
  value?: ComboboxItem | null;
  defaultValue?: ComboboxItem | null;
  onValueChange?: (value: ComboboxItem | null) => void;
  placeholder?: string;
  emptyText?: string;
  clearLabel?: string;
  openLabel?: string;
  hideLabel?: boolean;
  className?: string;
};

export function Combobox({
  label,
  items,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Yazarak ara",
  emptyText = "Eşleşen sonuç yok.",
  clearLabel = "Seçimi Temizle",
  openLabel = "Seçenekleri Göster",
  hideLabel = false,
  className,
}: ComboboxProps) {
  const id = useId();
  return (
    <Base.Root
      items={items as ComboboxItem[]}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next as ComboboxItem | null)}
      isItemEqualToValue={(a: ComboboxItem, b: ComboboxItem) => a.value === b.value}
      locale="tr-TR"
    >
      <div className={cn("grid content-start gap-1.5", className)}>
        <label htmlFor={id} className={hideLabel ? "sr-only" : "text-small font-semibold text-strong"}>
          {label}
        </label>
        <Base.InputGroup className="relative flex min-h-11 items-center rounded-md border border-line bg-overlay shadow-raised transition-[border-color,box-shadow] hover:border-line-strong focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary-wash">
          <Base.Input
            id={id}
            placeholder={placeholder}
            className="min-h-11 w-full min-w-0 bg-transparent pr-[5.5rem] pl-3 text-base pointer-fine:pr-[4.75rem] text-strong outline-none placeholder:text-muted"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <Base.Clear
              aria-label={clearLabel}
              className="grid size-11 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-8"
            >
              <X aria-hidden className="size-4" strokeWidth={1.75} />
            </Base.Clear>
            <Base.Trigger
              aria-label={openLabel}
              className="grid size-11 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-8 [&_svg]:transition-transform [&_svg]:duration-200 data-popup-open:[&_svg]:rotate-180"
            >
              <ChevronDown aria-hidden className="size-4" strokeWidth={1.75} />
            </Base.Trigger>
          </div>
        </Base.InputGroup>
      </div>
      <Base.Portal>
        <Base.Positioner sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <Base.Popup className="w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-xl border border-line bg-overlay p-1.5 text-body shadow-modal transition-[opacity,scale] duration-200 ease-[var(--ease-brand)] data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-[0.96] data-starting-style:opacity-0">
            <Base.Empty className="px-3 py-5 text-center text-base text-muted empty:hidden">{emptyText}</Base.Empty>
            <Base.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain outline-none data-empty:hidden">
              {(item: ComboboxItem) => (
                <Base.Item
                  key={item.value}
                  value={item}
                  className="grid min-h-11 cursor-default grid-cols-[1fr_1rem] items-center gap-2.5 rounded-md px-2.5 text-base outline-none select-none pointer-fine:min-h-9 data-highlighted:bg-surface-raised data-highlighted:text-strong data-selected:font-medium data-selected:text-strong"
                >
                  <span className="col-start-1 row-start-1 truncate">{item.label}</span>
                  <Base.ItemIndicator className="col-start-2 row-start-1 text-primary-ink">
                    <Check aria-hidden className="size-4" strokeWidth={2.25} />
                  </Base.ItemIndicator>
                </Base.Item>
              )}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
