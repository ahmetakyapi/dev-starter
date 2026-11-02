"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as Base } from "@base-ui/react/toggle-group";
import type { LucideIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Aç-kapa grubu: her biri BASILI / BASILI DEĞİL olan düğmeler (metin
 * düzenleyicide Kalın · İtalik · Altı Çizili; görünümde Izgara · Liste;
 * süzgeçte "Yalnız Okunmamış"). `multiple` ile birden çoğu basılı olabilir.
 *
 * NE ZAMAN BU, NE ZAMAN ÖTEKİ: seçimler birbirini dışlıyor VE hep biri seçili
 * olmak zorundaysa (Gün / Hafta / Ay) `segmented-control.tsx`: anlamı radyo
 * grubu. Araç çubuğunda biçim düğmeleri, ya da "hiçbiri" de geçerliyse bu:
 * anlamı `aria-pressed`. Tek bir aç/kapa ayarı için `switch.tsx`.
 *
 * HEADLESS KATMAN Base UI Toggle Group: `aria-pressed`, gezici tabindex
 * (Tab gruba bir kez girer, oklar düğmeler arasında dolaşır, uçta başa
 * döner), devre dışı öğeyi atlama ondan. Tekli kipte basılı düğmeye
 * yeniden basmak onu bırakır (hiçbiri seçili değil): "zorunlu tek seçim"
 * isteniyorsa segmented-control.
 *
 * İKON TEK BAŞINA AD DEĞİL: her öğenin `label`ı TİPTE zorunlu. `iconOnly`
 * öğede etiket `aria-label` olur ve fareyle/odakla açılan Tooltip'te
 * görünür; varsa kısayol da orada (`Kbd`) ve `aria-keyshortcuts`ta.
 * Kısayolun kendisini bağlamak çağıranın işi (düzenleyici zaten dinler).
 *
 * GÖRÜNÜŞ ("board" dili): `well` (varsayılan) gri kuyu, basılı düğme
 * kuyunun üstünde BEYAZ KARO (`bg-overlay shadow-raised`): durum renkle
 * değil yükseklikle okunur. `ghost` araç çubuğu içinde kuyusuz; basılı
 * düğme `bg-primary-wash text-primary-ink`. Basınca 0,96'ya çöker,
 * hareket azaltmada çökmez. Dokunmatikte 44 px, ince işaretçide 32/36.
 *
 *   <ToggleGroup aria-label="Metin Biçimi" multiple defaultValue={["bold"]}
 *     items={[{ value: "bold", label: "Kalın", icon: Bold, iconOnly: true, shortcut: ["⌘", "B"] }, …]} />
 */

export type ToggleGroupItem<T extends string> = {
  value: T;
  /** Görünen ya da (`iconOnly`) okunan ad. */
  label: string;
  icon?: LucideIcon;
  iconOnly?: boolean;
  disabled?: boolean;
  /** Tooltip'te gösterilecek tuşlar: ["⌘", "B"]. */
  shortcut?: readonly string[];
  /** `aria-keyshortcuts` değeri: "Meta+B Control+B". */
  keyshortcuts?: string;
};

const SIZES = {
  sm: { item: "h-11 min-w-11 px-2.5 pointer-fine:h-8 pointer-fine:min-w-8 pointer-fine:px-2 text-small gap-1.5", icon: "size-4" },
  md: { item: "h-11 min-w-11 px-3 pointer-fine:h-9 pointer-fine:min-w-9 pointer-fine:px-2.5 text-small gap-2", icon: "size-[1.125rem]" },
} as const;

const VARIANTS = {
  well: {
    group: "rounded-md bg-surface-sunken p-1 gap-0.5",
    item: "text-muted hover:text-strong data-pressed:bg-overlay data-pressed:text-strong data-pressed:shadow-raised",
  },
  ghost: {
    group: "gap-1",
    item: "text-muted hover:bg-surface hover:text-strong data-pressed:bg-primary-wash data-pressed:text-primary-ink",
  },
} as const;

type ToggleGroupProps<T extends string> = {
  items: readonly ToggleGroupItem<T>[];
  /** Grubun adı: "Metin Biçimi". */
  "aria-label": string;
  multiple?: boolean;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: (value: T[]) => void;
  size?: keyof typeof SIZES;
  variant?: keyof typeof VARIANTS;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  className?: string;
};

export function ToggleGroup<T extends string>({
  items,
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  variant = "well",
  orientation = "horizontal",
  disabled,
  className,
  ...props
}: ToggleGroupProps<T>) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <TooltipProvider>
      <Base<T>
        aria-label={props["aria-label"]}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next)}
        orientation={orientation}
        disabled={disabled}
        className={cn(
          "inline-flex w-fit",
          orientation === "vertical" ? "flex-col" : "flex-row",
          v.group,
          disabled && "opacity-50",
          className,
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const toggle = (
            <Toggle<T>
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              aria-label={item.iconOnly ? item.label : undefined}
              aria-keyshortcuts={item.keyshortcuts}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-sm font-medium whitespace-nowrap select-none",
                "transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96] motion-reduce:active:scale-100",
                "focus-visible:outline-offset-0 data-disabled:pointer-events-none data-disabled:opacity-40",
                s.item,
                item.iconOnly && "px-0 pointer-fine:px-0",
                v.item,
              )}
            >
              {Icon ? <Icon aria-hidden className={cn(s.icon, "shrink-0")} strokeWidth={2.25} /> : null}
              {item.iconOnly ? null : item.label}
            </Toggle>
          );
          if (!item.iconOnly) return toggle;
          return (
            <Tooltip
              key={item.value}
              label={
                <span className="inline-flex items-center gap-2">
                  {item.label}
                  {item.shortcut ? (
                    <span aria-hidden className="inline-flex gap-0.5">
                      {item.shortcut.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </span>
                  ) : null}
                </span>
              }
            >
              {toggle}
            </Tooltip>
          );
        })}
      </Base>
    </TooltipProvider>
  );
}
