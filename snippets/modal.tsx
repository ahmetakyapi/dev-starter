/**
 * Modal — animasyonlu diyalog
 *
 * Escape ve arka plana tıklama ile kapanır, açıkken sayfa kaymaz
 * (`use-scroll-lock.ts`, sayaçlı: üstüne açılan onay diyaloğu kilidi
 * erken çözmez). Odak açılışta panele girer, Tab içeride döner, kapanınca
 * açan düğmeye döner; Escape yalnızca en üstteki katmanı kapatır (`useLayer`).
 * MotionProvider (LazyMotion + domAnimation) altında çalışır; bu yüzden
 * `motion.*` değil `m.*`.
 *
 * Katman body'ye portal'lanır: transform / filter / backdrop-filter taşıyan
 * bir ata (`.glass` başlık, eğilen kart) `position: fixed`i kendi kutusuna
 * hapseder ve z-index'i kendi yığın bağlamında sınırlar (`mistakes.md` #88).
 *
 * Kullanım:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Yeni Kayıt">
 *     <p>İçerik</p>
 *   </Modal>
 *
 * Başlıksız kullanımda `ariaLabel` zorunlu: diyaloğun adı olmadan ekran
 * okuyucu yalnızca "diyalog" der. İlk odak belirli bir alanda olsun
 * istenirse `initialFocus={inputRef}` (autoFocus değil, bkz. `useLayer`).
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

const panel = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.16 } },
}

// Sunucuda `document.body` yok: portal yalnızca istemcide, hidrasyondan sonra
const noopSubscribe = () => () => {}

type ModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  initialFocus?: React.RefObject<HTMLElement | null>
} & ({ title: string; ariaLabel?: undefined } | { title?: undefined; ariaLabel: string })

export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  className,
  initialFocus,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Panelin içinde basılıp arka planda bırakılan tıklama (metin seçerken
  // taşma) ortak ataya, yani arka plana düşer; basış da orada başlamalı
  const pressedOnScrim = useRef(false)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  useScrollLock(open)
  useLayer(open && mounted, onClose, panelRef, initialFocus)

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          onPointerDown={(e) => {
            pressedOnScrim.current = e.target === e.currentTarget
          }}
          onClick={(e) => {
            // Portal DOM'da body'de ama React olayı ağaçta yukarı kabarır:
            // durmazsa modalı içeren satırın / kartın onClick'i de çalışır
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
            variants={panel}
            className={`w-full max-w-lg rounded-xl border border-line bg-overlay p-6 shadow-modal outline-none ${className ?? ''}`}
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
    </AnimatePresence>,
    document.body,
  )
}
