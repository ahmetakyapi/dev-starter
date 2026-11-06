// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";
import { SERIES_BG } from "./chart-card";

/**
 * Aşama çubukları: bir hunideki adımlar (ziyaret → kayıt → aktif → ücretli)
 * hap biçimli satırlar halinde. Ad solda, dolgu iz (track) üstünde ortada,
 * değer ve pay sağda. Sunucu bileşeni, JavaScript inmez.
 *
 * NEDEN ÇUBUK, NEDEN HUNİ ÇİZİMİ DEĞİL: aşamalar arası farkı göz ancak
 * ortak bir taban çizgisinde doğru kıyaslar. Daralan huni çizimi alanı
 * büyütür ve küçük farkı abartır; uzunluk ise doğrudan okunur.
 *
 * Satırlar `subgrid`: ad ve değer sütunu EN UZUN içeriğe göre bir kez
 * ölçülür, her satırın izi aynı yerden başlayıp aynı yerde biter.
 *
 * Pay her zaman ilk aşamaya göre (`%100` = ilk satır). İki aşama arası
 * dönüşüm ayrı bir bilgi; gerekiyorsa `note` ile satıra yaz.
 *
 * Erişilebilirlik: bir `ol`. Her satır "Kayıt 790 %67 (ilk aşamaya göre)"
 * olarak okunur; dolgu çubuğu `aria-hidden` (bilgi metinde zaten var).
 * Fareyle bir satırın üstüne gelince diğerleri geri çekilir (`:has`, JS yok);
 * bu yalnızca bir süs, bilgi her satırda zaten yazılı.
 *
 * İkon dolgunun üstünde `text-chart-ink`: seri renkleri iki temada da açık
 * pastel, ikon ikisinde de koyu kalır.
 */

type Stage = { label: ReactNode; value: number; icon?: ReactNode; note?: ReactNode };

const number = new Intl.NumberFormat("tr-TR");

export function StageBars({
  stages,
  title,
  className,
}: {
  stages: readonly Stage[];
  /** Ekran okuyucu adı: "Kayıt Hunisi". */
  title: string;
  className?: string;
}) {
  const base = stages[0]?.value || 1;
  return (
    <ol aria-label={title} className={cn("group/bars grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2", className)}>
      {stages.map((stage, i) => {
        const share = Math.round((stage.value / base) * 100);
        // Görünür en küçük dolgu: %0 olmayan değer iz içinde kaybolmasın
        const width = stage.value > 0 ? Math.max(share, 4) : 0;
        return (
          <li
            key={i}
            className="col-span-3 grid grid-cols-subgrid items-center transition-opacity duration-200 group-has-[li:hover]/bars:opacity-45 hover:opacity-100!"
          >
            <span className="truncate text-right text-base text-body">{stage.label}</span>
            <span aria-hidden className="relative h-6 overflow-hidden rounded-full bg-chart-track">
              <span
                className={cn("absolute inset-y-0 left-0 flex items-center rounded-full pl-2 text-chart-ink [&_svg]:size-3.5", SERIES_BG[i % SERIES_BG.length])}
                style={{ width: `${width}%` }}
              >
                {stage.icon}
              </span>
            </span>
            <span className="flex items-baseline gap-1.5 justify-self-end text-base tabular-nums">
              <span className="font-semibold text-strong">{number.format(stage.value)}</span>
              <span className="w-9 text-small text-muted">%{share}</span>
              <span className="sr-only"> (ilk aşamaya göre)</span>
            </span>
            {stage.note ? <span className="col-start-2 col-end-4 text-small text-muted">{stage.note}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
