'use client'

import { useCallback } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { useFinePointer } from './useFinePointer'

/**
 * Magnetic buton efekti — imleç yaklaştığında element çekilir.
 *
 * Kullanım (`m.*`: kökteki LazyMotion strict altında `motion.*` hata verir):
 *   const { mx, my, onMove, onLeave } = useMagnetic(0.26)
 *   <m.button style={{ x: mx, y: my }} onMouseMove={onMove} onMouseLeave={onLeave} />
 */
export function useMagnetic(strength = 0.26) {
  // Hareket azaltma isteyen kullanıcıda ve dokunmatikte element imlece hiç
  // çekilmez: dokunuşun ürettiği mousemove düğmeyi parmağın altından kaydırır
  // ve mouseleave gelene kadar orada bırakır. Hook'lar koşulsuz çağrılır
  // (hook kuralları), etkisi strength ile sıfırlanır; çizilen öğe aynı
  // kaldığı için hidrasyon farkı da doğmaz.
  const reduceMotion = useReducedMotion()
  const fine = useFinePointer()
  const effective = reduceMotion || !fine ? 0 : strength

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
