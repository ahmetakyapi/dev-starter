import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Konum çubuğu: "Ana Sayfa › Projeler › Açılış Zili". Sunucu bileşeni.
 *
 * Son öğe bulunulan sayfa: bağlantı değil, `aria-current="page"`. Ayraçlar
 * `aria-hidden`: ekran okuyucu "büyüktür işareti" okumasın; liste yapısı
 * sırayı zaten söylüyor.
 *
 * TELEFONDA yalnızca bir üst sayfaya dönüş bağlantısı ("‹ Projeler"): dört
 * düzeyli bir yol 390 piksele sığmıyor, kırpılmış bir yol ise hiçbir şey
 * söylemiyor. Tam yol `sm` ve üstünde.
 */

export type Crumb = { label: ReactNode; href?: string };

export function Breadcrumb({ items, label = "Sayfa Konumu", className }: { items: readonly Crumb[]; label?: string; className?: string }) {
  const parent = [...items].reverse().find((item, i) => i > 0 && item.href);
  return (
    <nav aria-label={label} className={cn("text-small", className)}>
      {parent?.href ? (
        <Link href={parent.href} className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-sm px-1 font-medium text-muted hover:text-strong sm:hidden">
          <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {parent.label}
        </Link>
      ) : null}
      <ol className="hidden flex-wrap items-center gap-1 sm:flex">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center gap-1">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={cn("px-1", last ? "font-semibold text-strong" : "text-muted")}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="inline-flex min-h-8 items-center rounded-sm px-1 text-muted transition-colors hover:text-strong">
                  {item.label}
                </Link>
              )}
              {last ? null : <ChevronRight aria-hidden className="size-3.5 text-muted opacity-60" strokeWidth={1.75} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
