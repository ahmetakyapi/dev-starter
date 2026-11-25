import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Özellik listesi: ince çizgili ikon + başlık + iki satır soluk açıklama,
 * satırlar kıl çizgiyle ayrılır. Sergilenen ürün görselinin (`art-mat`)
 * YANINDA durur: görsel "ne", liste "neden" der. Kart yok, ikon karesi yok;
 * ikon rengi grafik dizisinden (1-6) gelir ve satırları gözle ayırır.
 *
 * Referans turu 25 Kasım 2026: Lasso ("Optimizers / Localization /
 * Personalization", renkli çizgi ikon, satır arası kıl çizgi). Yalnız yapı.
 *
 * KURAL: 3-5 satır. Her başlık bir yetenek adı (Title Case), açıklama
 * neyi mümkün kıldığını tek cümleyle söyler; sıfat yığını değil olgu.
 * `color` yalnız ikonu boyar (süs); anlam metinde. `headingLevel`
 * sayfanın başlık düzenine göre (varsayılan 3).
 * Sunucu bileşeni.
 */

export interface FeatureItem {
  id: string;
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  /** Grafik dizisi rengi (1-6); verilmezse metin rengi. */
  color?: 1 | 2 | 3 | 4 | 5 | 6;
}

const COLOR = {
  1: "text-chart-1",
  2: "text-chart-2",
  3: "text-chart-3",
  4: "text-chart-4",
  5: "text-chart-5",
  6: "text-chart-6",
} as const;

export function FeatureList({ items, headingLevel = 3, dense = false, className }: { items: FeatureItem[]; headingLevel?: 2 | 3 | 4; dense?: boolean; className?: string }) {
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <ul role="list" className={cn("divide-y divide-line", className)}>
      {items.map((it) => (
        <li key={it.id} className={cn("grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4", dense ? "py-4" : "py-6 first:pt-0 last:pb-0")}>
          <span aria-hidden className={cn("pt-0.5 [&_svg]:size-6 [&_svg]:stroke-[1.6]", it.color ? COLOR[it.color] : "text-strong")}>
            {it.icon}
          </span>
          <div className="grid gap-1.5">
            <H className="text-title font-medium text-strong">{it.title}</H>
            <p className="max-w-[52ch] text-read text-pretty text-muted">{it.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
