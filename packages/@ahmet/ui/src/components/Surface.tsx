'use client'

import { useCallback, useRef } from 'react'
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

export type SurfaceVariant = 'surface' | 'glass'

export type SurfaceProps = {
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
const TILT_DEG = 8

export function Surface({
  children,
  className,
  variant = 'surface',
  tilt = false,
  glow = false,
}: SurfaceProps) {
  const ref = useRef<HTMLDivElement>(null)
  // 3B eğim vestibüler rahatsızlık kaynağı: hareket azaltmada eğim kapanır,
  // parlaklık (yalnızca renk) kalır.
  const reduceMotion = useReducedMotion()
  const tiltOn = tilt && !reduceMotion

  const rx = useSpring(useMotionValue(0), SPRING.snappy)
  const ry = useSpring(useMotionValue(0), SPRING.snappy)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!(tilt || glow) || !ref.current) return
      const r = ref.current.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      if (tiltOn) {
        rx.set(-(py - 0.5) * TILT_DEG)
        ry.set((px - 0.5) * TILT_DEG)
      }
      mouseX.set(px)
      mouseY.set(py)
    },
    [tilt, glow, tiltOn, rx, ry, mouseX, mouseY],
  )

  const onLeave = useCallback(() => {
    rx.set(0)
    ry.set(0)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [rx, ry, mouseX, mouseY])

  const shineX = useTransform(mouseX, [0, 1], ['0%', '100%'])
  const shineY = useTransform(mouseY, [0, 1], ['0%', '100%'])
  // Renk token'dan: tema değişince parlaklık da döner
  const shine = useMotionTemplate`radial-gradient(400px circle at ${shineX} ${shineY}, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)`

  return (
    <m.div
      ref={ref}
      style={tiltOn ? { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' } : undefined}
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
