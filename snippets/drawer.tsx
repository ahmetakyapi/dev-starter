/**
 * Drawer — yandan açılan panel
 *
 * Telefonda tam genişlik, masaüstünde sabit genişlik. Sağ ya da sol,
 * Escape ve arka plan desteği. Kilit sayaçlı (`use-scroll-lock.ts`).
 * MotionProvider (LazyMotion + domAnimation) altında çalışır.
 *
 * Kullanım:
 *   <Drawer open={open} onClose={() => setOpen(false)} side="right" title="Menü">
 *     <nav>...</nav>
 *   </Drawer>
 */

'use client'

import { useEffect, useId } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { X } from 'lucide-react'
import { useScrollLock } from './use-scroll-lock'

const EASE = [0.22, 1, 0.36, 1] as const

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

type DrawerProps = {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, side = 'right', title, children, className }: DrawerProps) {
  const titleId = useId()
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const offscreen = side === 'right' ? '100%' : '-100%'
  const panelVariants = {
    hidden: { x: offscreen },
    visible: { x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: { x: offscreen, transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-scrim"
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            variants={panelVariants}
            // Güvenli alan: sayfa viewport-fit=cover ile açılıyorsa çentik
            // ve ana ekran çubuğu paneli kesmesin
            className={`fixed inset-y-0 ${side === 'right' ? 'right-0 border-l' : 'left-0 border-r'} w-full max-w-sm overflow-y-auto border-line bg-overlay px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-overlay ${className ?? ''}`}
            onClick={(e) => e.stopPropagation()}
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
    </AnimatePresence>
  )
}
