'use client'

import { LazyMotion, domMax, m } from 'motion/react'
import Link from 'next/link'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Sekmeler, iki biçim:
 *
 * `Tabs`: AYNI SAYFADA içerik değiştiren sekmeler (WAI-ARIA tabs). Ok
 * tuşları sekmeler arasında gezer ve sekmeyi hemen etkinleştirir (otomatik
 * etkinleştirme: paneller hazır, yükleme yok). Tab tuşu sekme listesinden
 * PANELE geçer; sekme listesi tek durak. Paneller `hidden` ile saklanır,
 * DOM'dan atılmaz: içindeki form ya da kaydırma konumu sekme değişince
 * kaybolmaz.
 *
 * `TabLinks`: her sekme AYRI BİR ADRES (`/ayarlar/profil`, `/ayarlar/guvenlik`).
 * Bunlar sekme değil gezinme bağlantısı: `role="tab"` YOK, etkin olan
 * `aria-current="page"`. Paylaşılabilir, geri tuşu çalışır, sunucuda çizilir.
 * Ayrı adresli bir ekranı `Tabs` ile yapmak bağlantıyı paylaşılamaz kılar.
 *
 * İKİ GÖRÜNÜŞ (`variant`, "board" dili 2026-11):
 *   `well` (varsayılan): gri kuyu üstünde BEYAZ KARO kayar (`layoutId`,
 *     SPRING.snappy). Panel üstündeki kısa sekme listesi (3-5 sekme) için.
 *   `underline`: alt çizgi, sekmeyle birlikte yer değiştirir (CSS). Uzun,
 *     kayan sekme listesinde ya da sayfa başlığının altında daha sessiz.
 * Kayan karo `segmented-control.tsx` gibi `domMax` ister (düzen animasyonu);
 * bedeli ve tembel yükleme yolu orada anlatılıyor. `layoutId` `useId`den
 * türer, iki sekme listesi yan yana durabilir. `TabLinks`te karo bir
 * gezinmeden ötekine kaymaz (sayfa yeniden çizilir), yerinde belirir.
 * Hareketi azaltan kullanıcıda karo kaymaz (`MotionConfig reducedMotion`).
 */

export type TabItem = { value: string; label: ReactNode; panel: ReactNode; disabled?: boolean }

type TabsVariant = 'well' | 'underline'

type TabsProps = {
  items: readonly TabItem[]
  'aria-label': string
  variant?: TabsVariant
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

const LIST = {
  well: 'flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-md bg-surface-sunken shadow-well p-1 [scrollbar-width:none]',
  underline: 'flex max-w-full gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]',
} as const
const TAB = {
  well: 'relative inline-flex min-h-11 shrink-0 items-center rounded-sm px-3.5 text-base font-medium whitespace-nowrap text-muted transition-[color,scale] duration-150 hover:text-strong active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 pointer-fine:min-h-8 [&:focus-visible]:outline-offset-[-2px]',
  underline:
    'relative -mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-base font-medium whitespace-nowrap text-muted transition-colors hover:text-strong disabled:opacity-50 [&:focus-visible]:outline-offset-[-2px]',
} as const
const TAB_ACTIVE = { well: 'text-strong', underline: 'border-primary text-strong' } as const

/** Kayan beyaz karo: yalnızca `well` görünüşünde, etkin sekmenin altında. */
function Thumb({ layoutId }: { layoutId: string }) {
  return (
    <m.span
      layoutId={layoutId}
      transition={SPRING.snappy}
      aria-hidden
      className="absolute inset-0 rounded-sm bg-overlay shadow-raised"
    />
  )
}

export function Tabs({
  items,
  variant = 'well',
  defaultValue,
  value,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const id = useId()
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value)
  const active = value ?? own
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const enabled = items.filter((item) => !item.disabled)

  function activate(next: string) {
    setOwn(next)
    onValueChange?.(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabled.findIndex((item) => item.value === active)
    const last = enabled.length - 1
    const target =
      event.key === 'ArrowRight'
        ? enabled[index >= last ? 0 : index + 1]
        : event.key === 'ArrowLeft'
          ? enabled[index <= 0 ? last : index - 1]
          : event.key === 'Home'
            ? enabled[0]
            : event.key === 'End'
              ? enabled[last]
              : undefined
    if (!target) return
    event.preventDefault()
    activate(target.value)
    refs.current.get(target.value)?.focus()
  }

  return (
    <LazyMotion features={domMax}>
      <div className={className}>
        <div
          role="tablist"
          aria-label={props['aria-label']}
          onKeyDown={onKeyDown}
          className={LIST[variant]}
        >
          {items.map((item) => {
            const selected = item.value === active
            return (
              <button
                key={item.value}
                ref={(node) => {
                  if (node) refs.current.set(item.value, node)
                  else refs.current.delete(item.value)
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${item.value}`}
                aria-selected={selected}
                aria-controls={`${id}-panel-${item.value}`}
                tabIndex={selected ? 0 : -1}
                disabled={item.disabled}
                onClick={() => activate(item.value)}
                className={cn(TAB[variant], selected && TAB_ACTIVE[variant])}
              >
                {selected && variant === 'well' ? <Thumb layoutId={`${id}-thumb`} /> : null}
                <span className="relative">{item.label}</span>
              </button>
            )
          })}
        </div>
        {items.map((item) => (
          <div
            key={item.value}
            role="tabpanel"
            id={`${id}-panel-${item.value}`}
            aria-labelledby={`${id}-tab-${item.value}`}
            hidden={item.value !== active}
            // Panelin içinde odaklanabilir öğe yoksa Tab'ın ineceği bir durak olsun.
            tabIndex={0}
            className="pt-5 [&:focus-visible]:outline-offset-4"
          >
            {item.panel}
          </div>
        ))}
      </div>
    </LazyMotion>
  )
}

export type TabLink = { href: string; label: ReactNode }

type TabLinksProps = {
  items: readonly TabLink[]
  variant?: TabsVariant
  /** Etkin adres; genellikle sayfanın kendi yolu. */
  current: string
  'aria-label': string
  className?: string
}

export function TabLinks({ items, current, variant = 'well', className, ...props }: TabLinksProps) {
  const id = useId()
  return (
    <LazyMotion features={domMax}>
      <nav aria-label={props['aria-label']} className={cn(LIST[variant], className)}>
        {items.map((item) => {
          const selected = item.href === current
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={selected ? 'page' : undefined}
              scroll={false}
              className={cn(TAB[variant], selected && TAB_ACTIVE[variant])}
            >
              {selected && variant === 'well' ? <Thumb layoutId={`${id}-thumb`} /> : null}
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </LazyMotion>
  )
}
