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
  // Başlangıç ekranın ÇOK dışında: -600'de 620 piksellik ışığın kenarı
  // ekranın köşesine taşabiliyordu.
  const mx = useMotionValue(-10000)
  const my = useMotionValue(-10000)

  useEffect(() => {
    // Yalnız gerçek fare. iOS dokunuşta da `mousemove` gönderiyor; ışık
    // dokunulan yerde takılı kalıp sayfanın üstünü buğulu gösteriyordu
    // (Derinay, 3 Ekim 2026; mistakes.md #94).
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const handler = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [mx, my])

  return useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, ${color}, transparent 78%)`
}
