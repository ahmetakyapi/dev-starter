// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Grafik kartı: başlık satırı (etiket + büyük değer + değişim hapı + sağda
 * dönem seçici), ortada grafik, altta lejant karoları. Sunucu bileşeni.
 *
 * DİL ("board", 2026-11): kart hafif gri bir KUYU (`bg-surface`), içindeki
 * karolar beyaz (`bg-overlay`). Derinliği gölge değil iki ton farkı kurar;
 * karoda yalnızca kıl kadar bir gölge (`shadow-raised`). Kenarlık yok:
 * ton farkı zaten sınırı çiziyor, çizgi eklemek kalabalık yapar.
 *
 * Lejant karosu grafikteki rengin TEK açıklaması: seri rengi (`--chart-*`)
 * metin rengi olarak KULLANILMAZ (açık zeminde AA tutmaz); nokta renklidir,
 * ad ve değer `text-strong`/`text-muted`.
 *
 * `ChartLegend` bir `dl`: ekran okuyucu "Safari, 200" çiftini eşleşmiş okur.
 * Seri sırası grafikteki sırayla aynı olmalı; `series` 1-6 arası.
 */

export const SERIES_BG = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;
export type Series = 1 | 2 | 3 | 4 | 5 | 6;

const number = new Intl.NumberFormat("tr-TR");
const percent = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type ChartCardProps = {
  /** Title Case etiket: "Ziyaretçi". */
  label: ReactNode;
  /** Başlık değeri, biçimlenmiş: "925" ya da "₺7.462". */
  value: ReactNode;
  /** Yüzde değişim, ham sayı: 5.2 → "+%5,2". */
  change?: number | null;
  /** Değişimin neye göre olduğu (ekran okuyucu için): "geçen haftaya göre". */
  changeLabel?: string;
  /** Sağ üst: dönem seçici (`select.tsx`), sekmeler… */
  action?: ReactNode;
  /** Kartın ARIA adı yoksa `label` kullanılır; grafiğe `aria-labelledby` ver. */
  id?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Başlık düzeyi: sayfadaki yerine göre (h1'in hemen altındaysa h2). */
  titleAs?: "h2" | "h3" | "h4";
  className?: string;
};

export function ChartCard({ label, value, change, changeLabel = "önceki döneme göre", action, id, children, footer, titleAs: Title = "h3", className }: ChartCardProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const up = hasChange && change > 0;
  const down = hasChange && change < 0;
  return (
    // flex-col + lejant `mt-auto`: ızgarada yan yana kartlar satır boyuna uzar
    // (grid stretch), lejant karoları her kartta dipte aynı hizada durur.
    <section aria-labelledby={id} className={cn("flex flex-col rounded-xl bg-surface p-2", className)}>
      <header className="flex items-start justify-between gap-3 px-3 pt-3 pb-1">
        <div className="min-w-0">
          <Title id={id} className="text-small font-medium text-muted">
            {label}
          </Title>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-heading font-semibold tracking-tight text-strong tabular-nums">{value}</span>
            {hasChange ? (
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-small font-semibold tabular-nums",
                  up && "bg-success-wash text-success",
                  down && "bg-danger-wash text-danger",
                  // text-body: text-muted bu zeminde 12 px'te 4,34:1 (AA altı, Storybook axe ölçtü)
                  !up && !down && "bg-surface-raised text-body",
                )}
              >
                <span className="sr-only">{up ? "artış" : down ? "düşüş" : "değişim yok"}, {changeLabel}: </span>
                {up ? "+" : down ? "−" : ""}%{percent.format(Math.abs(change))}
              </span>
            ) : null}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {/* Kart satır boyuna uzayınca grafik boş alanın ortasında durur, üste yapışmaz. */}
      <div className="flex flex-1 flex-col justify-center px-3 py-4">{children}</div>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </section>
  );
}

type LegendItem = { label: ReactNode; value: number; series: Series; unit?: ReactNode };

/** Lejant karoları: beyaz karo, renkli nokta, ad, değer. 2 ya da 3 sütun. */
export function ChartLegend({ items, columns = 2, className }: { items: readonly LegendItem[]; columns?: 2 | 3; className?: string }) {
  return (
    <dl className={cn("grid gap-1.5", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2", className)}>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
          <dt className="flex items-center gap-1.5 text-small text-muted">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", SERIES_BG[item.series - 1])} />
            <span className="truncate">{item.label}</span>
          </dt>
          <dd className="mt-0.5 text-base font-semibold text-strong tabular-nums">
            {number.format(item.value)}
            {item.unit ? <span className="font-medium text-muted"> {item.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
