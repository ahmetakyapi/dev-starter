// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Çoklu seçim çipleri: bir listeden BİRDEN ÇOK etiket seçmek (bina
 * sistemleri, ilgi alanları, bildirim konuları, günler). Seçili çip koyu
 * dolgulu ve solda ✓; seçilmeyen kontur: durum renkle değil işaretle de
 * söylenir.
 *
 * FARKI: `FilterChip` (`chip.tsx`) bir LİSTEYİ SÜZEN aç/kapa anahtarıdır
 * (hafif primary-wash, sayaçlı, satırın üstünde); bu bileşen bir FORM
 * ALANIDIR: ters yüzeyle (`bg-strong`) belirgin, gruplu, `legend`li, isteğe
 * `max` sınırlı ve seçimi `value` dizisi olarak taşır. Tek seçim gerekiyorsa
 * çip değil `option-cards.tsx` ya da `segmented-control.tsx`; seçenek 12'den
 * fazlaysa `tag-input.tsx` / `combobox.tsx`.
 *
 * SEMANTİK: `role="group"` + görünür başlıkla adlı; her çip `aria-pressed`
 * butonu ("Gazlı Isıtma, açma/kapama butonu, basılı"). Çoklu seçimde
 * onay kutusu da doğru olurdu; çip dili için buton kalıbı seçildi ve
 * klavyede Tab/Boşluk/Enter ile işler (ok tuşu gerekmez). Seçili sayı
 * görünür ve okunur: "4 seçildi".
 *
 * `max` dolunca seçili olmayan çipler `disabled` olur ve nedeni görünür
 * ("En fazla 4 seçim"): sessiz yok sayma yok. Dokunmatikte 44 piksel,
 * farede 36.
 *
 *   <ChoiceChips legend="Bina Sistemleri" options={[{ value: "gaz", label: "Gazlı Isıtma" }, …]}
 *     value={sistemler} onValueChange={setSistemler} max={6} />
 */

export type Choice = { value: string; label: ReactNode };

type ChoiceChipsProps = {
  options: readonly Choice[];
  value: readonly string[];
  onValueChange: (next: string[]) => void;
  legend: ReactNode;
  /** En çok seçilebilir sayı; dolunca kalanlar kapanır. */
  max?: number;
  /** Seçili sayısını başlığın yanında göster: "4 seçildi". */
  showCount?: boolean;
  hideLegend?: boolean;
  className?: string;
};

export function ChoiceChips({ options, value, onValueChange, legend, max, showCount = true, hideLegend = false, className }: ChoiceChipsProps) {
  const id = useId();
  const full = max !== undefined && value.length >= max;

  function toggle(next: string) {
    onValueChange(value.includes(next) ? value.filter((v) => v !== next) : [...value, next]);
  }

  return (
    <div role="group" aria-labelledby={`${id}-l`} aria-describedby={max !== undefined ? `${id}-m` : undefined} className={cn("grid gap-2.5", className)}>
      <div className={cn("flex flex-wrap items-baseline gap-x-2", hideLegend && "sr-only")}>
        <p id={`${id}-l`} className="text-small font-semibold text-strong">
          {legend}
        </p>
        {showCount ? (
          <span className="text-small text-muted" aria-live="polite">
            {value.length} seçildi
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          const blocked = full && !selected;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={blocked}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-base font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 pointer-fine:min-h-9 motion-reduce:transition-none",
                selected ? "border-strong bg-strong text-page" : "border-line bg-overlay text-body shadow-raised hover:border-line-strong hover:text-strong",
              )}
            >
              {selected ? <Check aria-hidden className="-ml-0.5 size-3.5 shrink-0" strokeWidth={2.5} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
      {max !== undefined ? (
        <p id={`${id}-m`} className="text-small text-muted">
          {full ? `En fazla ${max} seçim yapılabilir; yenisini seçmek için birini kaldır.` : `En fazla ${max} seçim.`}
        </p>
      ) : null}
    </div>
  );
}
