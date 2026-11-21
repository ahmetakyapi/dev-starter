"use client";

import { type LucideIcon } from "lucide-react";
import { useId, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Kurulum kartı: kenar çubuğunun dibinde duran, kullanıcıyı kurulumu
 * bitirmeye çağıran küçük kart ("Kurulumu Bitir: Bina sensörlerini bağla,
 * arızaları erken görelim. ◔ 3 / 4 · Atla · Sonraki"). Ürüne ilk giren
 * kullanıcının "sırada ne var?" sorusunun yanıtı; boş sayfa uyarısı değil.
 *
 * İLERLEME HALKASI süstür ama bilgiyi taşır: `role="progressbar"`
 * (`aria-valuenow` = tamamlanan adım, `aria-valuemax` = toplam,
 * `aria-valuetext` = "Adım 3, toplam 4") ve yanında yazılı "3 / 4":
 * renk ya da çember tek işaret değil. Halka dolgusu `stroke-dashoffset` ile
 * dolar; hareket azaltmada geçiş yok.
 *
 * EYLEMLER: "Sonraki" birincil, "Atla" sönük ikincil; ikisi de gerçek
 * buton (`onNext`, `onSkip`). Kurulum bittiğinde (`step >= total`) kartı
 * gösterme: çağıran render etmez ya da `done` ile kısa "Hazır" hâli verir
 * (`doneText`). Kapatma butonu yok: atlamak kartı çağıranın ağacından
 * kaldırır.
 *
 * Kenar çubuğu genişliği (15-17 rem) için ölçülmüştür; başlık `h3`
 * (`headingLevel`), kart `section` ve başlığıyla adlanır. İstemci bileşeni
 * (butonlar).
 *
 *   <SetupCard title="Kurulumu Bitir" description="Bina sensörlerini bağla, arızaları erken görelim."
 *     step={3} total={4} onSkip={…} onNext={…} />
 */

type SetupCardProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Tamamlanan adım sayısı. */
  step: number;
  total: number;
  onSkip?: () => void;
  onNext?: () => void;
  skipLabel?: string;
  nextLabel?: string;
  /** Başlığın üstünde küçük, süs ikon (karo yok). */
  icon?: LucideIcon;
  /** `step >= total` iken gösterilen kısa metin. */
  doneText?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

const R = 8;
const C = 2 * Math.PI * R;

export function SetupCard({
  title,
  description,
  step,
  total,
  onSkip,
  onNext,
  skipLabel = "Atla",
  nextLabel = "Sonraki",
  icon: Icon,
  doneText = "Kurulum tamamlandı",
  headingLevel = 3,
  className,
}: SetupCardProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as ElementType;
  const safeTotal = Math.max(total, 1);
  const done = Math.min(Math.max(step, 0), safeTotal);
  const finished = done >= safeTotal;
  return (
    <section aria-labelledby={id} className={cn("grid gap-2 rounded-xl bg-overlay p-4 text-base shadow-raised ring-1 ring-line", className)}>
      {Icon ? <Icon aria-hidden className="size-5 text-muted" strokeWidth={1.75} /> : null}
      <Heading id={id} className="text-base font-semibold text-strong">
        {title}
      </Heading>
      {description ? <p className="text-small leading-relaxed text-muted">{description}</p> : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <svg
          role="progressbar"
          aria-label="Kurulum ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-valuenow={done}
          aria-valuetext={`Adım ${done}, toplam ${safeTotal}`}
          viewBox="0 0 20 20"
          className="size-5 shrink-0 -rotate-90"
        >
          <circle cx="10" cy="10" r={R} fill="none" strokeWidth="2.5" className="stroke-chart-track" />
          <circle
            cx="10"
            cy="10"
            r={R}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - done / safeTotal)}
            className="stroke-primary transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
          />
        </svg>
        <span aria-hidden className="text-small font-medium whitespace-nowrap text-body tabular-nums">
          {done} / {safeTotal}
        </span>
        {finished ? (
          <span className="ms-auto text-small whitespace-nowrap text-success">{doneText}</span>
        ) : (
          <span className="ms-auto flex items-center gap-1">
            {onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-2 text-small font-medium text-muted transition-colors hover:text-strong pointer-fine:min-h-8"
              >
                {skipLabel}
              </button>
            ) : null}
            {onNext ? (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line bg-overlay px-3 text-small font-medium text-strong shadow-raised transition-colors hover:border-line-strong pointer-fine:min-h-8"
              >
                {nextLabel}
              </button>
            ) : null}
          </span>
        )}
      </div>
    </section>
  );
}
