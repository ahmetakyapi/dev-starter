/**
 * ScrollProgress — sayfanın ne kadarının okunduğunu gösteren ince çubuk
 *
 * Uzun okuma sayfaları (yazı, rehber) için; kısa sayfada gürültüdür.
 * Çubuk `scaleX` ile büyür, `width` ile değil: genişlik animasyonu her
 * karede yerleşimi yeniden hesaplatır, transform yalnızca birleştirir.
 *
 * Hareketi azaltan okuyucuda yay kapanır: çubuk kaydırmayı birebir izler,
 * peşinden yaylanarak gelmez. Çubuk yalnızca görsel (`aria-hidden`);
 * ilerlemeyi ekran okuyucuya duyurmak gürültü olurdu.
 *
 * MotionProvider (LazyMotion + domAnimation) altında çalışır.
 *
 * Kullanım (yazı sayfasında, başlığın hemen altında):
 *   <ScrollProgress />
 */

'use client'

import { m, useReducedMotion, useScroll, useSpring } from 'motion/react'

const SPRING = { stiffness: 220, damping: 32, restDelta: 0.001 } as const

export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, SPRING)
  const reduce = useReducedMotion()

  return (
    <m.div
      aria-hidden
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
      className={`fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-0.5 origin-left bg-primary ${className ?? ''}`}
    />
  )
}
