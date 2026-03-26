/**
 * Confirm — Onay dialog bileseni
 *
 * Tehlikeli islemler icin (silme, iptal, vb.) onay modal'i.
 * Animasyonlu, keyboard destekli, renk varyantli.
 *
 * Kullanim:
 *   <Confirm
 *     open={showConfirm}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *     title="Silmek istediginize emin misiniz?"
 *     description="Bu islem geri alinamaz."
 *     variant="danger"
 *     confirmText="Sil"
 *   />
 */

'use client'

import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const panel = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.15 } },
}

type Variant = 'danger' | 'warning' | 'default'

const confirmStyles: Record<Variant, string> = {
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
  warning: 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20',
  default: 'bg-ahmet-indigo hover:brightness-110 text-white shadow-lg shadow-ahmet-indigo/20',
}

interface ConfirmProps {
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
  cancelText = 'Iptal',
  variant = 'default',
  loading = false,
}: ConfirmProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
          aria-modal="true"
          role="alertdialog"
        >
          <motion.div
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass w-full max-w-md rounded-2xl p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${confirmStyles[variant]}`}
              >
                {loading ? 'Yukleniyor...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
