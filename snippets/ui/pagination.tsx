import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Sayfalama: sayfa numarası ADRESTE (`?sayfa=3`). Bağlantılar gerçek;
 * paylaşılabilir, geri tuşu çalışır, JavaScript kapalıyken de çalışır.
 * Sunucu bileşeni.
 *
 * Telefonda numaralar yerine "3 / 12" künyesi ve iki ok: yedi numara 390
 * piksele 44 piksellik dokunma hedefleriyle sığmıyor. Masaüstünde ilk, son
 * ve geçerli sayfanın iki komşusu, aralar "…".
 *
 * Geçerli sayfa `aria-current="page"`, bağlantı değil düz metin: kendine
 * giden bağlantı ekran okuyucuda boş bir durak olur.
 *
 * `scroll`: liste sayfanın tepesindeyse varsayılan (true) doğru, yeni sayfa
 * başından okunur. Liste sayfanın ortasında bir panelse `scroll={false}` ve
 * listenin başına bir çapa (`#liste`) daha iyi.
 */

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Sayfa adresini kurar: `(n) => "?sayfa=" + n`. */
  hrefFor: (page: number) => string;
  scroll?: boolean;
  labels?: { nav?: string; previous?: string; next?: string; page?: (n: number) => string };
  className?: string;
};

/** Gösterilecek sayfalar: ilk, son, geçerli ± 1; aralar `null` ("…"). */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

const CELL =
  "inline-grid min-h-11 min-w-11 place-items-center rounded-md px-2 text-base font-medium tabular-nums transition-colors pointer-fine:min-h-9 pointer-fine:min-w-9";

export function Pagination({ page, pageCount, hrefFor, scroll = true, labels = {}, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const { nav = "Sayfalama", previous = "Önceki Sayfa", next = "Sonraki Sayfa", page: pageLabel = (n) => `Sayfa ${n}` } = labels;
  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  const arrow = (target: number, enabled: boolean, label: string, Glyph: typeof ChevronLeft) =>
    enabled ? (
      <Link href={hrefFor(target)} scroll={scroll} aria-label={label} title={label} className={cn(CELL, "text-body hover:bg-primary-wash hover:text-strong")}>
        <Glyph aria-hidden className="size-4" strokeWidth={1.75} />
      </Link>
    ) : (
      <span aria-hidden className={cn(CELL, "text-muted opacity-40")}>
        <Glyph className="size-4" strokeWidth={1.75} />
      </span>
    );

  return (
    <nav aria-label={nav} className={cn("flex items-center justify-between gap-2 sm:justify-center", className)}>
      {arrow(page - 1, hasPrev, previous, ChevronLeft)}
      <p className="text-small font-medium text-muted tabular-nums sm:hidden">
        {page} / {pageCount}
      </p>
      <ul className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pageCount).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              {n === page ? (
                <span aria-current="page" className={cn(CELL, "bg-primary text-on-primary")}>
                  {n}
                </span>
              ) : (
                <Link href={hrefFor(n)} scroll={scroll} aria-label={pageLabel(n)} className={cn(CELL, "text-body hover:bg-primary-wash hover:text-strong")}>
                  {n}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>
      {arrow(page + 1, hasNext, next, ChevronRight)}
    </nav>
  );
}
