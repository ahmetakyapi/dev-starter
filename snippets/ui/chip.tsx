import { Check, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Çip: iki ayrı iş, iki ayrı bileşen.
 *
 * `FilterChip`: SÜZGEÇ. Aç/kapa bir düğmedir (`aria-pressed`), seçim
 * kutusu değil; ekran okuyucu "Bu Hafta, açma/kapama düğmesi, basılı" der.
 * Seçiliyken zemin `bg-primary-wash`, metin `text-primary-ink` VE solda ✓
 * belirir: renk tek işaret değil. ✓ yer açarak değil, çipin iç boşluğunu
 * kullanarak gelir (genişlik zıplamaz): boşken sol iç boşluk 12, seçiliyken
 * ikon 14 + 6 boşluk + 8 kenar.
 * Tek seçimli süzgeç (yalnızca biri) gerekiyorsa çip değil
 * `segmented-control.tsx`.
 *
 * `RemovableChip`: KALDIRILABİLİR değer (seçilmiş etiket, alıcı, şehir).
 * Çipin gövdesi düğme DEĞİL; yalnızca × düğme ve adı "Kaldır: İstanbul".
 * Gövdeye tıklayınca silmek, okumaya çalışırken değer kaybettirir.
 * Kaldırıldıktan sonra odak yok olan düğmeyle birlikte kaybolur: üst
 * bileşen odağı bir sonraki çipin × düğmesine ya da girişe taşımalı.
 *
 * `ChipGroup`: `role="group"` + ad ("Durum Süzgeci"). Çipler doğal Tab
 * sırasında; 10'dan fazla çip varsa süzgeç değil arama kutusu gerekir.
 *
 * Dokunmatikte çip satırı 44 piksel yükseklik, farede 32. Sunucu bileşeni:
 * `onClick` istemci bir üstten gelir.
 */

type FilterChipProps = Omit<ComponentProps<"button">, "aria-pressed"> & {
  selected: boolean;
  icon?: ReactNode;
  /** Sağda küçük sayı: "12". */
  count?: number;
};

const count = new Intl.NumberFormat("tr-TR");

export function FilterChip({ selected, icon, count: n, className, children, type = "button", ...props }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "group inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-base font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 pointer-fine:min-h-8",
        selected
          ? "border-transparent bg-primary-wash text-primary-ink"
          : "border-line bg-overlay text-body shadow-raised hover:border-line-strong hover:text-strong",
        className,
      )}
      {...props}
    >
      {selected ? (
        <Check aria-hidden className="-ml-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
      ) : icon ? (
        <span aria-hidden className="-ml-0.5 text-muted [&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      {children}
      {typeof n === "number" ? (
        <span className={cn("text-small tabular-nums", selected ? "text-primary-ink" : "text-muted")}>
          {count.format(n)}
        </span>
      ) : null}
    </button>
  );
}

type RemovableChipProps = {
  children: ReactNode;
  /** Kaldırma düğmesinin adı için düz metin: "İstanbul". */
  label: string;
  onRemove?: () => void;
  /** Çipin başında avatar ya da renk noktası. */
  leading?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function RemovableChip({ children, label, onRemove, leading, disabled, className }: RemovableChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-overlay pl-3 text-base font-medium whitespace-nowrap text-strong shadow-raised",
        leading ? "pl-1" : "pl-3",
        className,
      )}
    >
      {leading ? <span aria-hidden className="grid place-items-center">{leading}</span> : null}
      {children}
      <button
        type="button"
        aria-label={`Kaldır: ${label}`}
        onClick={onRemove}
        disabled={disabled}
        className="group -my-1.5 -mr-0.5 grid size-11 cursor-pointer place-items-center rounded-full outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 pointer-fine:size-8"
      >
        <span
          aria-hidden
          className="grid size-5 place-items-center rounded-full text-muted transition-[background-color,color,transform] duration-150 group-hover:bg-surface-raised group-hover:text-strong group-active:scale-90 group-focus-visible:outline-2 group-focus-visible:outline-offset-1 group-focus-visible:outline-line-focus"
        >
          <X className="size-3" strokeWidth={2.5} />
        </span>
      </button>
    </span>
  );
}

type ChipGroupProps = ComponentProps<"div"> & {
  /** Zorunlu: grubun adı, "Durum Süzgeci". */
  "aria-label": string;
};

export function ChipGroup({ className, ...props }: ChipGroupProps) {
  return <div role="group" className={cn("flex flex-wrap items-center gap-2", className)} {...props} />;
}
