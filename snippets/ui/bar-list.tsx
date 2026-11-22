"use client";

import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
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
 * SIRA, PAY, DEĞİŞİM (isteğe bağlı): `rank` satırın başına sıra numarası
 * ekler ("1 Northwind"); `meta` değerin soluna sönük ikinci ölçü (pay "%13,2");
 * `delta` (yüzde değişim, ham sayı) değerin sağına ok + işaretli küçük rakam
 * koyar. Delta üç kanaldan söylenir (işaret, ok, renk) ve ekran okuyucuya
 * "artış"/"düşüş" gider; artışın kötü olduğu listede (`positiveIsGood={false}`)
 * yalnız renk ters döner. `leading` (logo, avatar) `icon`dan farklı olarak
 * kendi boyutunu taşır; ikinci ölçü, sıra ve logo birlikte "En İyi Satıcılar"
 * tablosu kurar. Alan verilmezse satır eskisi gibi: ad + değer.
 *
 * Hareket: ekrana girince dolgular soldan, sırayla uzar (`scaleX`, çubuk
 * çizimi; genişlik animasyonu değil). Hareketi azaltan kullanıcıda süre 0.
 * Erişilebilirlik: bir `ol`; her satır "Fiyatlandırma 2.140" diye okunur,
 * dolgu `aria-hidden`.
 */

type Item = {
  label: ReactNode;
  value: number;
  href?: string;
  icon?: ReactNode;
  /** Logo ya da avatar: kendi boyutunu taşır (ikon gibi 16 piksele zorlanmaz). */
  leading?: ReactNode;
  /** Değerin solunda sönük ikinci ölçü: pay, adet. Biçimi çağıran verir. */
  meta?: ReactNode;
  /** Yüzde değişim, ham sayı: 12 → "+%12". */
  delta?: number;
};

const percent = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

const WASH = ["bg-chart-1/30", "bg-chart-2/30", "bg-chart-3/30", "bg-chart-4/30", "bg-chart-5/30", "bg-chart-6/30"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

export function BarList({
  items,
  title,
  columns,
  series = 2,
  sort = true,
  rank = false,
  positiveIsGood = true,
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
  /** Satır başına sıra numarası (1, 2, 3…). */
  rank?: boolean;
  /** Artış iyi haber mi: gider ve hata listesinde `false` (renk ters döner). */
  positiveIsGood?: boolean;
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
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : i * 0.06, ease: EASE }}
              />
              <span className="relative flex min-w-0 items-center gap-2 text-base text-strong [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted">
                {rank ? (
                  <span aria-hidden className="w-4 shrink-0 text-small text-body tabular-nums">
                    {i + 1}
                  </span>
                ) : null}
                {row.leading}
                {row.icon}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="relative flex shrink-0 items-center gap-3">
                {row.meta !== undefined ? <span className="text-small text-body tabular-nums">{row.meta}</span> : null}
                <span className="text-base font-semibold text-strong tabular-nums">{format.format(row.value)}</span>
                {typeof row.delta === "number" && Number.isFinite(row.delta) ? <Delta value={row.delta} positiveIsGood={positiveIsGood} /> : null}
              </span>
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

/** Değişim: ok + işaretli yüzde + renk; ekran okuyucu "artış"/"düşüş" okur. */
function Delta({ value, positiveIsGood }: { value: number; positiveIsGood: boolean }) {
  const rounded = Number(value.toFixed(1));
  const up = rounded > 0;
  const down = rounded < 0;
  const good = up ? positiveIsGood : down ? !positiveIsGood : null;
  const Glyph = down ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={cn(
        // OPAK beyaz karo: satırın arkasındaki dolgu (chart wash, saydam) metnin
        // zeminini boyar; yıkamalı rozet (Stat'taki gibi) dolgunun üstünde AA'yı
        // tutmaz (3,45:1 ölçüldü). Beyaz karo üstünde durum mürekkepleri AA.
        "inline-flex min-w-14 items-center justify-end gap-0.5 rounded-sm bg-overlay px-1.5 py-0.5 text-small font-semibold tabular-nums",
        good === true && "text-success",
        good === false && "text-danger",
        good === null && "text-body",
      )}
    >
      {up || down ? <Glyph aria-hidden strokeWidth={2} className="size-3.5" /> : null}
      <span className="sr-only">{up ? "artış " : down ? "düşüş " : "değişim yok "}</span>
      {up ? "+" : down ? "−" : ""}%{percent.format(Math.abs(rounded))}
    </span>
  );
}
