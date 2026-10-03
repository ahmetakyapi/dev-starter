'use client'

import { useEffect } from 'react'
import { useMotionTemplate, useMotionValue } from 'motion/react'

/**
 * Mouse pozisyonunu takip eden radial gradient spotlight.
 * Hero section veya sayfa arka planına uygulanır.
 *
 * Kullanım:
 *   const spotlight = useSpotlight()
 *   <motion.div style={{ background: spotlight }} />
 */
// Varsayılan renk token'dan türetilir; düz bir rgba temayla dönmezdi
const DEFAULT_COLOR = 'color-mix(in srgb, var(--primary) 7%, transparent)'

export function useSpotlight(radius = 620, color = DEFAULT_COLOR) {
  const mx = useMotionValue(-600)
  const my = useMotionValue(-600)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [mx, my])

  return useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, ${color}, transparent 78%)`
}
