// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "../utils";

/**
 * Hızlı oylama: ekip içi küçük karar ("hangi şablon?", "indirim kaç olsun?")
 * tek dokunuşla. Oy vermeden önce sonuçlar GİZLİ (oy sonucu görüp sürüye
 * katılmasın); oy verince her satırın çubuğu oranına dolar, yüzdeler belirir,
 * kendi seçimin işaretlenir, önde olan koyu. Kendi seçimine yeniden basmak
 * oyu geri alır; başka seçeneğe basmak oyu taşır.
 *
 * NE ZAMAN DEĞİL: anket (çok soru, yorum) ya da memnuniyet puanı
 * (`rating.tsx`); tek kişinin tercihi (radyo grubu). Oylamanın sonucu bir
 * kararsa, karar ayrıca yazılır; oylama yalnız eğilimi gösterir.
 *
 * Yöntem Allo font sayfasındaki anket kartından (2026-11; davranış, kod değil).
 * Çubuk `transform: scaleX` ile dolar (genişlik canlandırılmaz), 350 ms;
 * hareketi azaltanda anında. Durum kontrollü: `value` (senin oyun) ve
 * `counts` (sen hariç diğer oylar) çağırandan; bileşen yalnız gösterir.
 *
 * Erişilebilirlik: `role="radiogroup"` değil, aç-kapa butonları
 * (`aria-pressed`): oy geri alınabilir, radyo bunu söyleyemez. Oy verilince
 * her butonun adı sonucu da taşır ("Kısa şablon, yüzde 50, 3 oy"); toplam
 * canlı bölgede.
 *
 * Örnek:
 *   <QuickPoll question="Hangi yanıt şablonu?" options={[{ id: "kisa", label: "Kısa" }]}
 *     counts={{ kisa: 2 }} value={mine} onValueChange={setMine} />
 */

export type PollOption = { id: string; label: string };

type QuickPollProps = {
  question: string;
  /** Kısa bağlam: "Mert soruyor · cumaya kadar". */
  meta?: string;
  options: readonly PollOption[];
  /** Senin dışındaki oylar. */
  counts: Readonly<Record<string, number>>;
  /** Senin oyun; `null`: oy vermedin. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  className?: string;
};

const number = new Intl.NumberFormat("tr-TR");

export function QuickPoll({ question, meta, options, counts, value, onValueChange, className }: QuickPollProps) {
  const id = useId();
  const voted = value !== null;
  const tally = options.map((o) => (counts[o.id] ?? 0) + (o.id === value ? 1 : 0));
  const total = tally.reduce((a, n) => a + n, 0);
  const lead = Math.max(...tally);

  return (
    <section aria-labelledby={`${id}-q`} className={cn("grid gap-3", className)}>
      <div>
        <h3 id={`${id}-q`} className="text-base font-semibold text-strong">
          {question}
        </h3>
        {meta ? <p className="mt-0.5 text-small text-muted">{meta}</p> : null}
      </div>
      <ul className="grid gap-2">
        {options.map((o, i) => {
          const n = tally[i];
          const share = total ? Math.round((n / total) * 100) : 0;
          const mine = o.id === value;
          const leading = voted && n === lead && n > 0;
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-pressed={mine}
                aria-label={voted ? `${o.label}, %${share}, ${number.format(n)} oy${mine ? ", senin oyun" : ""}` : o.label}
                onClick={() => onValueChange(mine ? null : o.id)}
                className={cn(
                  "relative flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-xl px-4 text-start ring-1 ring-inset transition-[box-shadow,scale] duration-150 active:scale-[0.98] motion-reduce:active:scale-100",
                  mine ? "ring-primary/40" : "ring-line hover:ring-line-strong",
                )}
              >
                {/* Sonuç çubuğu: oydan önce boş; scaleX ile dolar (düzen değişmez). */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-full origin-left transition-transform duration-350 ease-[var(--ease-brand)] motion-reduce:transition-none",
                    mine ? "bg-primary-wash" : leading ? "bg-surface-raised" : "bg-surface",
                  )}
                  style={{ transform: `scaleX(${voted ? share / 100 : 0})` }}
                />
                <span
                  aria-hidden
                  className={cn(
                    "relative grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-inset transition-colors duration-200",
                    mine ? "bg-primary text-on-primary ring-primary" : "ring-line-strong",
                  )}
                >
                  {mine ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className={cn("relative min-w-0 flex-1 truncate text-base", leading ? "font-semibold text-strong" : "text-body")}>{o.label}</span>
                <span
                  aria-hidden
                  className={cn("relative text-small font-semibold text-strong tabular-nums transition-opacity duration-200", voted ? "opacity-100" : "opacity-0")}
                >
                  %{share}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="px-1 text-small text-muted">
        {number.format(total)} oy{voted ? " · seçimine yeniden basınca oyun geri alınır" : " · sonuçlar oy verince görünür"}
      </p>
    </section>
  );
}
