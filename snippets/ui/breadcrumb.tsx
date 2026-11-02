import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Konum çubuğu: "Ana Sayfa › Ayarlar › Profil". Sunucu bileşeni.
 *
 * Son öğe bulunulan sayfa: bağlantı değil, `aria-current="page"`. Ayraçlar
 * `aria-hidden`: ekran okuyucu "büyüktür işareti" okumasın; liste yapısı
 * sırayı zaten söylüyor.
 *
 * İKON ("board" dili, 2026-11): her öğe isteğe bağlı bir lucide ikonu
 * taşır (`icon: <House />`); ikon süstür (`aria-hidden`), ad metinde.
 * Ayraç soluk bir chevron. Bağlantılar üzerine gelince yumuşak gri bir
 * hapa oturur (`bg-surface-raised`), bulunulan sayfa `text-strong`.
 * `iconOnly` ilk öğenin yalnızca ikonla görünmesini sağlar (ev ikonu);
 * adı o zaman görünmez metin olarak durur.
 *
 * TELEFONDA yalnızca bir üst sayfaya dönüş bağlantısı ("‹ Projeler"): dört
 * düzeyli bir yol 390 piksele sığmıyor, kırpılmış bir yol ise hiçbir şey
 * söylemiyor. Tam yol `sm` ve üstünde.
 */

export type Crumb = { label: ReactNode; href?: string; icon?: ReactNode }

type BreadcrumbProps = {
  items: readonly Crumb[]
  label?: string
  /** İlk öğe yalnızca ikonla görünsün (ikonu varsa); ad ekran okuyucuda kalır. */
  iconOnly?: boolean
  className?: string
}

const ICON = 'shrink-0 [&_svg]:size-4 [&_svg]:stroke-[1.75]'

export function Breadcrumb({
  items,
  label = 'Sayfa Konumu',
  iconOnly = false,
  className,
}: BreadcrumbProps) {
  const parent = [...items].reverse().find((item, i) => i > 0 && item.href)
  return (
    <nav aria-label={label} className={cn('text-small', className)}>
      {parent?.href ? (
        <Link
          href={parent.href}
          className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-sm px-1 font-medium text-muted transition-colors hover:text-strong sm:hidden"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {parent.label}
        </Link>
      ) : null}
      <ol className="hidden flex-wrap items-center gap-0.5 sm:flex">
        {items.map((item, index) => {
          const last = index === items.length - 1
          const hideText = iconOnly && index === 0 && Boolean(item.icon)
          const content = (
            <>
              {item.icon ? (
                <span aria-hidden className={ICON}>
                  {item.icon}
                </span>
              ) : null}
              <span className={hideText ? 'sr-only' : undefined}>{item.label}</span>
            </>
          )
          return (
            <li key={index} className="inline-flex items-center gap-0.5">
              {last || !item.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-8 items-center gap-1.5 px-1.5',
                    last ? 'font-medium text-strong' : 'text-muted',
                  )}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1.5 text-muted transition-colors hover:bg-surface-raised hover:text-strong"
                >
                  {content}
                </Link>
              )}
              {last ? null : (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted opacity-50"
                  strokeWidth={2}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
