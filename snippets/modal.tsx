/**
 * Modal — animasyonlu diyalog
 *
 * Escape ve arka plana tıklama ile kapanır, açıkken sayfa kaymaz
 * (`use-scroll-lock.ts`, sayaçlı: üstüne açılan onay diyaloğu kilidi
 * erken çözmez). MotionProvider (LazyMotion + domAnimation) altında çalışır;
 * bu yüzden `motion.*` değil `m.*`.
 *
 * Kullanım:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Yeni Kayıt">
 *     <p>İçerik</p>
 *   </Modal>
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

const panel = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.16 } },
}

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
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

  return (
    <AnimatePresence>
      {open && (
        <m.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            variants={panel}
            className={`w-full max-w-lg rounded-xl border border-line bg-overlay p-6 shadow-overlay ${className ?? ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between gap-4">
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
