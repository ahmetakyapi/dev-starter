/**
 * Toast — bildirim sistemi
 *
 * Context + AnimatePresence ile genel bildirim yönetimi.
 * Durum renkleri token'dan (`success`/`danger`/`warning`);
 * ikonlar lucide, emoji değil. Bölge `aria-live="polite"`: ekran okuyucu
 * mesajı okur ama sürmekte olan konuşmayı kesmez. Her bildirimin kapatma
 * düğmesi var; hata bildirimi süreyle kaybolmaz, kullanıcı kapatana kadar
 * kalır (okumasını bitirmeden kaybolan hata mesajı, WCAG 2.2.1).
 *
 * Kullanım:
 *   // layout.tsx:
 *   <ToastProvider>{children}</ToastProvider>
 *
 *   // İstemci bileşeninde:
 *   const toast = useToast()
 *   toast.success('Kaydedildi')
 *   toast.error('Bir hata oluştu')
 */

'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = Record<ToastVariant, (message: string) => void>

const EASE = [0.22, 1, 0.36, 1] as const

// Zemin opak `overlay`: yarı saydam bir durum rengi, altında kayan içerikle
// birlikte okunmaz hâle geliyordu. Durumu kenarlık ve ikon taşır.
const variantStyles: Record<ToastVariant, { border: string; icon: string }> = {
  success: { border: 'border-success/40', icon: 'text-success' },
  error: { border: 'border-danger/40', icon: 'text-danger' },
  warning: { border: 'border-warning/40', icon: 'text-warning' },
  info: { border: 'border-primary/40', icon: 'text-primary-ink' },
}

const icons: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const ToastContext = createContext<ToastContextValue | null>(null)

// crypto.randomUUID yalnızca güvenli bağlamda (HTTPS, localhost) var: telefondan
// LAN adresiyle (http://192.168.x.x) açılan sayfada her toast çağrısı
// çağıranın olay işleyicisini yarıda kesiyordu. Kimlik sağlayıcı içinde
// tekil olsa yeter.
let nextToastId = 0

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalı')
  return ctx
}

type ToastProviderProps = {
  children: React.ReactNode
  /** Görünme süresi (ms); hata bildirimine uygulanmaz */
  duration?: number
}

export function ToastProvider({ children, duration = 4000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (variant: ToastVariant, message: string) => {
      nextToastId += 1
      const id = String(nextToastId)
      setToasts((prev) => [...prev, { id, message, variant }])
      if (variant !== 'error') setTimeout(() => dismiss(id), duration)
    },
    [duration, dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg) => addToast('success', msg),
      error: (msg) => addToast('error', msg),
      warning: (msg) => addToast('warning', msg),
      info: (msg) => addToast('info', msg),
    }),
    [addToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.variant]
            return (
              <m.div
                key={toast.id}
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={`flex items-center gap-2.5 rounded-lg border bg-overlay py-3 pr-2 pl-4 text-base font-medium text-strong shadow-floating ${variantStyles[toast.variant].border}`}
              >
                <Icon className={`size-4 shrink-0 ${variantStyles[toast.variant].icon}`} aria-hidden />
                <span className="min-w-0 flex-1">{toast.message}</span>
                {/* 44 px dokunma hedefi; negatif dikey boşluk bildirimi uzatmaz */}
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Bildirimi kapat"
                  className="-my-2 grid size-11 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </m.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
