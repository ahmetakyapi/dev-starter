"use client";

import { Select as Base } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Seçim kutusu: 5-15 seçenekten biri, yer dar. Daha az seçenekte
 * `radio-group.tsx` (hepsi görünür, tek dokunuş), daha fazlasında ya da
 * aranacaksa `combobox.tsx`.
 *
 * Base UI Select: listbox kalıbı (ok tuşları, Home/End, harf yazarak atlama,
 * Escape ile kapanma ve odağın tetikleyiciye dönmesi), gizli bir yerel giriş
 * sayesinde form gönderimi (`name`) ve etiket bağı (`Select.Label`).
 *
 * NEDEN YEREL `<select>` DEĞİL: yerel seçim telefonda en iyisi (sistem
 * tekerleği) ve form dostu; ama açık listesi stillenemez, iki temada
 * farklı görünür ve seçeneklere ikon ya da açıklama konamaz. Basit bir form
 * alanıysa yerel `<select>` hâlâ doğru seçim; şablonun `Field` diliyle
 * stilleyip kullan. Bu bileşen, görünüşü arayüzün parçası olan seçimler için.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): tetikleyici beyaz karo (`bg-overlay`
 * + kıl çizgisi + `shadow-raised`), açıkken vurgu çizgisi ve yumuşak halka.
 * Liste `rounded-xl` karo, `p-1.5`; vurgulu öğe yumuşak gri
 * (`bg-surface-raised`), seçili öğede SAĞDA tik (`primary-ink`): etiketler
 * sol kenarda hizalı kalır.
 *
 * Konum: liste tetikleyicinin üstüne değil ALTINA açılır
 * (`alignItemWithTrigger={false}`): üste binen liste dar ekranda seçili
 * öğeyi parmağın altına getiriyor ve kaydırmayla karışıyor.
 */

export type SelectItem = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  label: ReactNode;
  items: readonly SelectItem[];
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function Select({
  label,
  items,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Seçin",
  hideLabel = false,
  disabled,
  required,
  className,
}: SelectProps) {
  return (
    <Base.Root
      items={items}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next as string | null)}
      disabled={disabled}
      required={required}
    >
      <div className={cn("grid content-start gap-1.5", className)}>
        <Base.Label className={hideLabel ? "sr-only" : "text-small font-semibold text-strong"}>{label}</Base.Label>
        <Base.Trigger className="flex min-h-11 w-full min-w-40 items-center justify-between gap-3 rounded-md border border-line bg-overlay px-3 text-start text-base text-strong shadow-raised transition-[border-color,box-shadow] select-none hover:border-line-strong data-disabled:opacity-50 data-popup-open:border-primary data-popup-open:ring-[3px] data-popup-open:ring-primary-wash pointer-fine:min-h-10">
          <Base.Value placeholder={placeholder} className="min-w-0 truncate data-placeholder:text-muted" />
          <Base.Icon className="text-muted">
            <ChevronsUpDown aria-hidden className="size-4" strokeWidth={1.75} />
          </Base.Icon>
        </Base.Trigger>
      </div>
      <Base.Portal>
        <Base.Positioner alignItemWithTrigger={false} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <Base.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-xl border border-line bg-overlay p-1.5 text-body shadow-modal outline-none transition-[opacity,scale] duration-200 ease-[var(--ease-brand)] data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-[0.96] data-starting-style:opacity-0">
            <Base.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain">
              {items.map((item) => (
                <Base.Item
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className="grid min-h-11 cursor-default grid-cols-[1fr_1rem] items-center gap-2.5 rounded-md px-2.5 text-base outline-none select-none pointer-fine:min-h-9 data-disabled:opacity-50 data-highlighted:bg-surface-raised data-highlighted:text-strong data-selected:font-medium data-selected:text-strong"
                >
                  <Base.ItemText className="col-start-1 row-start-1 truncate">{item.label}</Base.ItemText>
                  <Base.ItemIndicator className="col-start-2 row-start-1 text-primary-ink">
                    <Check aria-hidden className="size-4" strokeWidth={2.25} />
                  </Base.ItemIndicator>
                </Base.Item>
              ))}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
