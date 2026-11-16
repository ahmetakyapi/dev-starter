// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Sheet } from "./sheet";
import { cn } from "../utils";

/**
 * Süzgeç çekmecesi: telefonda bütün süzgeç ve sıralama seçimleri alttan
 * açılan tek yüzeyde, dipte "Temizle" ve SONUÇ SAYISINI söyleyen ana düğme
 * ("8 Talebi Göster"). `sheet.tsx`in üstüne kurulu.
 *
 * NE ZAMAN: masaüstünde araç çubuğuna sığan süzgeçler (arama, çipler,
 * açılır seçimler) telefonda yer kaplıyorsa; tablo listesinin üstüne tek bir
 * "Süzgeçler" düğmesi konur, gerisi burada. NE ZAMAN DEĞİL: tek bir süzgeç
 * varsa (`segmented-control` yeter) ya da seçim anında sonucu göstermeli ve
 * liste görünür kalmalıysa (masaüstü araç çubuğu, `chip.tsx`).
 *
 * Neden sonuç sayılı düğme: çekmece listeyi örter; kullanıcı seçtiği
 * süzgecin kaç kayıt bıraktığını göremez. Sayı düğmede olunca "0 sonuç"a
 * düşmeden önce görür (Assetora turu 2026-11, davranış alındı, kod değil).
 * Seçimler ANINDA uygulanır (sayı gerçek); düğme yalnız çekmeceyi kapatır.
 *
 * Gruplar: `multiple` grup çoklu seçim (`aria-pressed` düğmeler, ✓ ile),
 * tekli grup radyo grubu (`role="radiogroup"`, ok tuşları, gezici tabindex).
 * Renk tek ayırt edici değil: seçili çipte ✓ ve kalın kenar da var.
 * Sayı değişimi canlı bölgede okunur. Ek içerik (tarih takvimi, aralık)
 * `children` olarak grupların altına.
 *
 * Örnek:
 *   <FilterSheet open={open} onOpenChange={setOpen} groups={GROUPS}
 *     value={filters} onValueChange={setFilters} resultCount={rows.length}
 *     resultLabel={(n) => `${n} Talebi Göster`} onClear={clear} />
 */

export type FilterOption = { value: string; label: ReactNode; count?: number };
export type FilterGroup = {
  id: string;
  label: string;
  options: readonly FilterOption[];
  /** Çoklu seçim (öncelik, etiket). Verilmezse tekli (sıralama, durum). */
  multiple?: boolean;
};
export type FilterValue = Readonly<Record<string, readonly string[]>>;

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: readonly FilterGroup[];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  /** Seçimlerden sonra kalan kayıt sayısı. */
  resultCount: number;
  resultLabel?: (count: number) => string;
  onClear: () => void;
  /** "Temizle" etkin mi; verilmezse herhangi bir grupta seçim varsa. */
  canClear?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  clearLabel?: string;
  children?: ReactNode;
};

const number = new Intl.NumberFormat("tr-TR");

const CHIP =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-base font-medium ring-1 ring-inset transition-[background-color,color,box-shadow] duration-150 pointer-fine:min-h-10 [&_svg]:size-4 [&_svg]:shrink-0";
const ON = "bg-primary-wash text-primary-ink ring-2 ring-primary";
const OFF = "bg-overlay text-body ring-line hover:bg-surface hover:text-strong";

export function FilterSheet({
  open,
  onOpenChange,
  groups,
  value,
  onValueChange,
  resultCount,
  resultLabel = (n) => `${number.format(n)} Sonucu Göster`,
  onClear,
  canClear,
  title = "Süzgeç ve Sıralama",
  description,
  clearLabel = "Temizle",
  children,
}: FilterSheetProps) {
  const set = (id: string, next: readonly string[]) => onValueChange({ ...value, [id]: next });
  const clearable = canClear ?? groups.some((g) => (value[g.id] ?? []).length > 0);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <button
            type="button"
            onClick={onClear}
            disabled={!clearable}
            className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-base font-semibold text-body transition-colors hover:bg-surface-raised hover:text-strong disabled:pointer-events-none disabled:opacity-50"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-base font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover sm:min-w-48"
          >
            {resultLabel(resultCount)}
          </button>
        </>
      }
    >
      <div className="grid gap-6">
        {groups.map((group) => (
          <Group key={group.id} group={group} selected={value[group.id] ?? []} onChange={(next) => set(group.id, next)} />
        ))}
        {children}
      </div>
      <p aria-live="polite" className="sr-only">
        {number.format(resultCount)} sonuç
      </p>
    </Sheet>
  );
}

function Group({ group, selected, onChange }: { group: FilterGroup; selected: readonly string[]; onChange: (next: readonly string[]) => void }) {
  const labelId = `${useId()}-${group.id}`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(0, group.options.findIndex((o) => selected.includes(o.value)));

  // Tekli grupta ok tuşları seçimi taşır (radyo grubu davranışı).
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (group.multiple) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (current + step + group.options.length) % group.options.length;
    onChange([group.options[next].value]);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <p id={labelId} className="mb-2 text-small font-medium text-muted">
        {group.label}
      </p>
      <div
        role={group.multiple ? "group" : "radiogroup"}
        aria-labelledby={labelId}
        onKeyDown={onKey}
        className="flex flex-wrap gap-2"
      >
        {group.options.map((option, i) => {
          const on = selected.includes(option.value);
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role={group.multiple ? undefined : "radio"}
              aria-checked={group.multiple ? undefined : on}
              aria-pressed={group.multiple ? on : undefined}
              tabIndex={group.multiple || i === current ? 0 : -1}
              onClick={() =>
                onChange(group.multiple ? (on ? selected.filter((v) => v !== option.value) : [...selected, option.value]) : [option.value])
              }
              className={cn(CHIP, on ? ON : OFF)}
            >
              {on ? <Check aria-hidden strokeWidth={2.25} /> : null}
              {option.label}
              {option.count !== undefined ? (
                <span className={cn("text-small tabular-nums", on ? "text-primary-ink" : "text-muted")}>{number.format(option.count)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
