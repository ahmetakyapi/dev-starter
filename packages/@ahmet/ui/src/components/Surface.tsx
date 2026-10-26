'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  m,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { cn } from '../utils'
import { SPRING } from '../variants'
import { useFinePointer } from '../hooks/useFinePointer'

export type SurfaceVariant = 'surface' | 'glass'

// motion bu adları jest ve animasyon geri çağrısı olarak yeniden tanımlar;
// DOM imzasıyla `m.div`e yayılamazlar.
type MotionConflicts = 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'

/**
 * `div`in kendi öznitelikleri (`id`, `role`, `aria-*`, `data-*`, `ref`,
 * olay işleyicileri) olduğu gibi geçer: bölge ya da etiket için ek
 * wrapper gerekmez. `style` ve fare işleyicileri eğimle birleşir.
 */
export type SurfaceProps = Omit<React.ComponentProps<'div'>, 'children' | MotionConflicts> & {
  children: React.ReactNode
  className?: string
  /**
   * `surface` (varsayılan): ton farkı + hairline, iki temada da okunur.
   * `glass`: opt-in bulanık yüzey; yalnızca içeriğin üstünde YÜZEN öğeler için.
   * Sınıfların kendisi @ahmetakyapi/theme/css'te (`@supports` ve
   * `prefers-reduced-transparency` korumalı).
   */
  variant?: SurfaceVariant
  tilt?: boolean
  glow?: boolean
}

// Eğim derecesi — imleç kartın kenarındayken ulaşılan en büyük açı
const TILT_DEG = 4
// Perspektifsiz 3B döndürme düz izdüşüm verir: birkaç derece ekranda
// yalnızca binde birkaç küçülme olarak kalır, eğim hiç görünmez. Perspektif
// transform'un içinde: üst öğeye `perspective` yazmak gerekmez.
const PERSPECTIVE = 800

export function Surface({
  children,
  className,
  variant = 'surface',
  tilt = false,
  glow = false,
  style,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  ...rest
}: SurfaceProps) {
  // 3B eğim vestibüler rahatsızlık kaynağı: hareket azaltmada eğim kapanır,
  // parlaklık (yalnızca renk) kalır. Kapı yalnızca işleyicide: stil `tilt`
  // prop'una bağlı kalır. `useReducedMotion` sunucuda null, istemcide true
  // döndüğü için stile bağlansaydı hidrasyonda öznitelik farkı doğardı.
  const reduceMotion = useReducedMotion()
  const tiltOn = tilt && !reduceMotion
  // Dokunmatikte ne eğim ne parlaklık: dokunuşun mousemove'u efekti
  // dokunulan yerde dondurur (mistakes.md #94).
  const fine = useFinePointer()

  const rx = useSpring(useMotionValue(0), SPRING.snappy)
  const ry = useSpring(useMotionValue(0), SPRING.snappy)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e)
      if (!fine || !(tilt || glow)) return
      const r = e.currentTarget.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      if (tiltOn) {
        rx.set(-(py - 0.5) * 2 * TILT_DEG)
        ry.set((px - 0.5) * 2 * TILT_DEG)
      }
      mouseX.set(px)
      mouseY.set(py)
    },
    [onMouseMove, fine, tilt, glow, tiltOn, rx, ry, mouseX, mouseY],
  )

  const reset = useCallback(() => {
    rx.set(0)
    ry.set(0)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [rx, ry, mouseX, mouseY])

  // Perspektifte imlecin altındaki kenar geri yatar ve duran imlecin altından
  // çekilir: tarayıcı aynı koordinatta mouseleave verir, kart düzleşir, imleç
  // yeniden içeride kalır, döngü titreme olur. Ayrılış bu yüzden eğimsiz
  // kutuya göre sınanır; imleç o kutudaysa sıfırlama, gerçekten çıkana dek
  // pencere düzeyinde izlenen harekete bırakılır.
  const stopWatch = useRef<(() => void) | null>(null)
  useEffect(() => () => stopWatch.current?.(), [])

  const onEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      stopWatch.current?.()
      onMouseEnter?.(e)
    },
    [onMouseEnter],
  )

  const onLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e)
      stopWatch.current?.()
      if (tiltOn) {
        // Eğimsiz kutu: transform aynı karede kaldırılıp geri yazılır, boyanmaz
        const el = e.currentTarget
        const transform = el.style.transform
        el.style.transform = 'none'
        const r = el.getBoundingClientRect()
        el.style.transform = transform
        const inside = (x: number, y: number) => x > r.left && x < r.right && y > r.top && y < r.bottom
        if (inside(e.clientX, e.clientY)) {
          const watch = (ev: MouseEvent) => {
            if (inside(ev.clientX, ev.clientY)) return
            stop()
            reset()
          }
          // Kaydırma ve sayfadan çıkış kutuyu bayatlatır: güvenli yön sıfırlamak
          const bail = () => {
            stop()
            reset()
          }
          const stop = () => {
            window.removeEventListener('mousemove', watch)
            window.removeEventListener('scroll', bail, true)
            document.documentElement.removeEventListener('mouseleave', bail)
            stopWatch.current = null
          }
          window.addEventListener('mousemove', watch)
          // passive: bail kaydirmayi engellemez, tarayici beklemeden kaydirir
          window.addEventListener('scroll', bail, { capture: true, passive: true })
          document.documentElement.addEventListener('mouseleave', bail)
          stopWatch.current = stop
          return
        }
      }
      reset()
    },
    [onMouseLeave, tiltOn, reset],
  )

  const shineX = useTransform(mouseX, [0, 1], ['0%', '100%'])
  const shineY = useTransform(mouseY, [0, 1], ['0%', '100%'])
  // Renk token'dan: tema değişince parlaklık da döner
  const shine = useMotionTemplate`radial-gradient(400px circle at ${shineX} ${shineY}, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)`

  return (
    <m.div
      {...rest}
      style={tilt ? { ...style, rotateX: rx, rotateY: ry, transformPerspective: PERSPECTIVE } : style}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(variant, 'relative overflow-hidden', className)}
    >
      {(tilt || glow) && (
        <m.div aria-hidden className="pointer-events-none absolute inset-0 z-10" style={{ background: shine }} />
      )}
      {children}
    </m.div>
  )
}

/** @deprecated v3: `<Surface variant="glass">` kullan. v4'te kaldırılacak. */
export type GlassCardProps = Omit<SurfaceProps, 'variant'>

/** @deprecated v3: `<Surface variant="glass">` kullan. v4'te kaldırılacak. */
export function GlassCard(props: GlassCardProps) {
  return <Surface {...props} variant="glass" />
}
