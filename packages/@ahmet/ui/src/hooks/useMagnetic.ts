'use client'

import { useCallback } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Magnetic buton efekti — imleç yaklaştığında element çekilir.
 *
 * Kullanım:
 *   const { mx, my, onMove, onLeave } = useMagnetic(0.26)
 *   <motion.button style={{ x: mx, y: my }} onMouseMove={onMove} onMouseLeave={onLeave} />
 */
export function useMagnetic(strength = 0.26) {
  // Hareket azaltma isteyen kullanıcıda element imlece hiç çekilmez.
  // Hook koşulsuz çağrılır (hook kuralları), etkisi strength ile sıfırlanır.
  const reduceMotion = useReducedMotion()
  const effective = reduceMotion ? 0 : strength

  const mx = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      mx.set((event.clientX - rect.left - rect.width / 2) * effective)
      my.set((event.clientY - rect.top - rect.height / 2) * effective)
    },
    [mx, my, effective],
  )

  const onLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  return { mx, my, onMove, onLeave }
}
