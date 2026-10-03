/**
 * Confirm — onay diyaloğu
 *
 * Geri alınamayan işlemler (silme, iptal) için. Escape ile vazgeçilir,
 * odak açılışta VAZGEÇ düğmesine gider: Enter'a refleksle basan kullanıcı
 * yanlışlıkla silmesin. Kilit sayaçlı (`use-scroll-lock.ts`): bir modalın
 * üstünde açılıp kapanınca alttaki modalın kilidi yerinde kalır.
 *
 * Kullanım:
 *   <Confirm
 *     open={showConfirm}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *     title="Kaydı Sil"
 *     description="Bu işlem geri alınamaz."
 *     variant="danger"
 *     confirmText="Sil"
 *   />
 */

'use client'

import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
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

type Variant = 'danger' | 'warning' | 'default'

// Renk yalnızca token sınıfından; tema `data-theme` ile döner
const confirmStyles: Record<Variant, string> = {
  danger: 'bg-danger text-on-primary hover:opacity-90',
  warning: 'bg-warning text-page hover:opacity-90',
  default: 'bg-primary text-on-primary hover:bg-primary-hover',
}

type ConfirmProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: Variant
  loading?: boolean
}

export function Confirm({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'Vazgeç',
  variant = 'default',
  loading = false,
}: ConfirmProps) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <m.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          onClick={onCancel}
        >
          <m.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            variants={panel}
            className="w-full max-w-md rounded-xl border border-line bg-overlay p-6 shadow-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-title font-semibold text-strong">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-2 text-base text-soft">
                {description}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="h-11 rounded-md px-4 text-base font-medium text-soft transition-colors hover:bg-surface-raised hover:text-strong"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                aria-busy={loading}
                className={`h-11 rounded-md px-4 text-base font-semibold transition disabled:opacity-50 ${confirmStyles[variant]}`}
              >
                {loading ? 'İşleniyor…' : confirmText}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
