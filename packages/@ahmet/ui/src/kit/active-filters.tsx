// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { RemovableChip } from "./chip";
import { cn } from "../utils";

/**
 * Etkin süzgeç çipleri: listenin üstünde "şu an neye bakıyorum" satırı.
 * Her etkin süzgeç ("Durum: Geciken", "Bölge: Kıyı") kaldırılabilir bir çip,
 * sonda tek "Temizle" butonu. Süzgeçler çekmeceye ya da açılır listelere
 * gömüldüğünde bile liste neden kısaldı sorusunun cevabı gözün önünde kalır;
 * filtre yığını (4 açılır liste + sekmeler) tek satıra iner.
 *
 * NE ZAMAN: üç ya da daha çok süzgeci olan her liste (müşteri, fatura, sayaç).
 * Tek süzgeç ya da yalnız sekme varsa gerekmez. Süzgeç oluşturucusu için
 * `filter-sheet.tsx`; bu bileşen yalnız sonucu gösterir ve geri alır.
 *
 * Hiçbir süzgeç yoksa HİÇBİR ŞEY çizmez (`null`): boş bir satır yer tutmaz.
 * Durum çağıranda; bileşen `onRemove(id)` ve `onClear()` çağırır. Sunucu
 * bileşeni: fonksiyon prop'larını istemci bir üst bileşen verir.
 *
 * ERİŞİLEBİLİRLİK: `role="group"` + ad; her çipin × butonu "Kaldır: Durum,
 * Geciken" diye adlanır (`RemovableChip`). Kaldırılan çip DOM'dan çıkınca odak
 * kaybolur: çağıran odağı bir sonraki çipin × butonuna ya da arama kutusuna
 * taşımalı. Sonuç sayısı (`summary`) görünen metindir, canlı bölge DEĞİL;
 * süzgeç değişince sayıyı duyurmak istiyorsan çağıran kendi `role="status"`
 * bölgesine yazar.
 *
 *   <ActiveFilters
 *     filters={[{ id: "status", label: "Durum", value: "Geciken" }]}
 *     onRemove={(id) => clear(id)}
 *     onClear={clearAll}
 *     summary="37 fatura"
 *   />
 */

export type ActiveFilter = {
  id: string;
  /** Süzgecin adı: "Durum". */
  label: string;
  /** Seçili değer: "Geciken". */
  value: ReactNode;
  /** Kaldır butonunun adı için düz metin; verilmezse `label`. */
  valueText?: string;
};

type ActiveFiltersProps = {
  filters: readonly ActiveFilter[];
  onRemove?: (id: string) => void;
  onClear?: () => void;
  /** Grubun ekran okuyucu adı. */
  label?: string;
  clearLabel?: string;
  /** Görünen sonuç özeti: "37 fatura". */
  summary?: ReactNode;
  className?: string;
};

export function ActiveFilters({
  filters,
  onRemove,
  onClear,
  label = "Etkin Süzgeçler",
  clearLabel = "Temizle",
  summary,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((f) => (
        <RemovableChip key={f.id} label={`${f.label}, ${f.valueText ?? (typeof f.value === "string" ? f.value : f.label)}`} onRemove={onRemove ? () => onRemove(f.id) : undefined}>
          <span className="text-muted">{f.label}:</span> {f.value}
        </RemovableChip>
      ))}
      {onClear && filters.length > 1 ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 cursor-pointer rounded-md px-2 text-base font-medium text-primary-ink underline-offset-4 hover:underline pointer-fine:min-h-8"
        >
          {clearLabel}
        </button>
      ) : null}
      {summary ? <span className="ml-auto text-small text-muted tabular-nums">{summary}</span> : null}
    </div>
  );
}
