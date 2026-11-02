"use client";

import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Series } from "@/components/ui/chart-card";

/**
 * Sıralı çubuk listesi: "En Çok Ziyaret Edilen Sayfalar", "Kaynaklar",
 * "Ülkeler" gibi uzun adlı, 3-10 kalemlik bir sıralama. Ad solda, değer
 * sağda, satırın ARKASINDA değerle orantılı soluk bir dolgu (wash). Grafik
 * gibi değil liste gibi okunur; ad uzun olduğunda sütun grafiğinden iyidir
 * (etiket döndürmek, kısaltmak gerekmez).
 *
 * DOLGU METNİN ARKASINDA: ayrı bir çubuk satırı ad ile değer arasında yer
 * kaplar ve telefonda adı kısaltır. Dolgu serinin rengi `%30`
 * (`bg-chart-N/30`); üstündeki `text-strong` iki temada da AA kalır. En
 * büyük değer tam genişlik, gerisi ona göre.
 *
 * Varsayılan olarak BÜYÜKTEN KÜÇÜĞE sıralanır (`sort={false}` verilen
 * sırayı korur: zaman ya da aşama sırası gibi anlamlı bir düzen varsa).
 *
 * `href` verilen satır bağlantıdır: bütün satır tıklanır, dokunmatikte
 * 44 px, masaüstünde 36 px (`pointer-fine:`). Bağlantısız satır düz metin.
 *
 * Hareket: ekrana girince dolgular soldan, sırayla uzar (`scaleX`, çubuk
 * çizimi; genişlik animasyonu değil). Hareketi azaltan kullanıcıda süre 0.
 * Erişilebilirlik: bir `ol`; her satır "Fiyatlandırma 2.140" diye okunur,
 * dolgu `aria-hidden`.
 */

type Item = { label: ReactNode; value: number; href?: string; icon?: ReactNode };

const WASH = ["bg-chart-1/30", "bg-chart-2/30", "bg-chart-3/30", "bg-chart-4/30", "bg-chart-5/30", "bg-chart-6/30"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

export function BarList({
  items,
  title,
  columns,
  series = 2,
  sort = true,
  valueFormat,
  className,
}: {
  items: readonly Item[];
  /** Listenin ekran okuyucu adı: "En Çok Ziyaret Edilen Sayfalar". */
  title: string;
  /** Görünür sütun başlıkları: `["Sayfa", "Ziyaret"]`. */
  columns?: readonly [string, string];
  series?: Series;
  sort?: boolean;
  /** Değer biçimi: `{ style: "percent" }` ya da para birimi. */
  valueFormat?: Intl.NumberFormatOptions;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const format = new Intl.NumberFormat("tr-TR", valueFormat);
  const rows = sort ? [...items].sort((a, b) => b.value - a.value) : items;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className={cn("w-full", className)}>
      {columns ? (
        <div aria-hidden className="mb-2 flex justify-between px-3 text-micro font-medium text-muted">
          <span>{columns[0]}</span>
          <span>{columns[1]}</span>
        </div>
      ) : null}
      <ol aria-label={title} className="space-y-1">
        {rows.map((row, i) => {
          const body = (
            <>
              <m.span
                aria-hidden
                className={cn("absolute inset-y-0 left-0 rounded-md", WASH[series - 1])}
                style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%`, originX: 0 }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : i * 0.06, ease: EASE }}
              />
              <span className="relative flex min-w-0 items-center gap-2 text-base text-strong [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted">
                {row.icon}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="relative shrink-0 text-base font-semibold text-strong tabular-nums">{format.format(row.value)}</span>
            </>
          );
          const rowClass = "relative flex min-h-11 items-center justify-between gap-4 rounded-md px-3 pointer-fine:min-h-9";
          return (
            <li key={i}>
              {row.href ? (
                <Link href={row.href} className={cn(rowClass, "transition-colors hover:bg-surface-raised")}>
                  {body}
                </Link>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
