/**
 * Drawer — yandan açılan panel
 *
 * Telefonda tam genişlik, masaüstünde sabit genişlik. Sağ ya da sol,
 * Escape ve arka plan desteği. Kilit sayaçlı (`use-scroll-lock.ts`); odak
 * panele girer, Tab içeride döner, kapanınca açan düğmeye döner (`useLayer`).
 * MotionProvider (LazyMotion + domAnimation) altında çalışır.
 *
 * Katman body'ye portal'lanır: menü çekmecesi çoğu zaman `.glass` (backdrop-
 * filter) taşıyan yapışkan başlığın içinde durur ve o ata `position: fixed`i
 * başlığın kutusuna hapseder (`mistakes.md` #88).
 *
 * Kullanım:
 *   <Drawer open={open} onClose={() => setOpen(false)} side="right" title="Menü">
 *     <nav>...</nav>
 *   </Drawer>
 *
 * Başlıksız kullanımda `ariaLabel` zorunlu; ilk odak için `initialFocus`.
 */

'use client'

import { useId, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { X } from 'lucide-react'
import { useLayer, useScrollLock } from './use-scroll-lock'

const EASE = [0.22, 1, 0.36, 1] as const

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// Sunucuda `document.body` yok: portal yalnızca istemcide, hidrasyondan sonra
const noopSubscribe = () => () => {}

type DrawerProps = {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  children: React.ReactNode
  className?: string
  initialFocus?: React.RefObject<HTMLElement | null>
} & ({ title: string; ariaLabel?: undefined } | { title?: undefined; ariaLabel: string })

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  ariaLabel,
  children,
  className,
  initialFocus,
}: DrawerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Panelde başlayıp arka planda biten sürükleme kapatmasın (bkz. modal.tsx)
  const pressedOnScrim = useRef(false)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  useScrollLock(open)
  useLayer(open && mounted, onClose, panelRef, initialFocus)

  if (!mounted) return null

  const offscreen = side === 'right' ? '100%' : '-100%'
  const panelVariants = {
    hidden: { x: offscreen },
    visible: { x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: { x: offscreen, transition: { duration: 0.2 } },
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-scrim"
          onPointerDown={(e) => {
            pressedOnScrim.current = e.target === e.currentTarget
          }}
          onClick={(e) => {
            // React olayı portaldan çekmeceyi içeren bileşene kabarmasın
            e.stopPropagation()
            if (pressedOnScrim.current && e.target === e.currentTarget) onClose()
            pressedOnScrim.current = false
          }}
        >
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            tabIndex={-1}
            variants={panelVariants}
            // Güvenli alan: sayfa viewport-fit=cover ile açılıyorsa çentik
            // ve ana ekran çubuğu paneli kesmesin
            className={`fixed inset-y-0 ${side === 'right' ? 'right-0 border-l' : 'left-0 border-r'} w-full max-w-sm overflow-y-auto border-line bg-overlay px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-modal outline-none ${className ?? ''}`}
          >
            {title && (
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 id={titleId} className="text-title font-semibold text-strong">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-2 grid size-11 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong"
                  aria-label="Kapat"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
            )}
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
