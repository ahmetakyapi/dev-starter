/**
 * Drawer — Yandan acilan panel
 *
 * Mobilde tam genislik, desktop'ta sabit genislik.
 * Sag veya sol yonlu, keyboard + backdrop destegi.
 *
 * Kullanim:
 *   <Drawer open={open} onClose={() => setOpen(false)} side="right" title="Menu">
 *     <nav>...</nav>
 *   </Drawer>
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

interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  className,
}: DrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
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

  const panelVariants = {
    hidden: { x: side === 'right' ? '100%' : '-100%' },
    visible: { x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: { x: side === 'right' ? '100%' : '-100%', transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`surface fixed inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} w-full max-w-sm p-6 ${className ?? ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  aria-label="Kapat"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
