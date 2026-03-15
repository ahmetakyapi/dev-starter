'use client'

import { useRef, useCallback } from 'react'
import {
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'

/**
 * 3D kart eğimi + holografik parlaklık efekti.
 * Projects kartlarında kullanılır.
 *
 * Kullanım:
 *   const tilt = useCardTilt(8)
 *   <motion.div
 *     ref={tilt.ref}
 *     style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
 *     onMouseMove={tilt.onMove}
 *     onMouseLeave={tilt.onLeave}
 *   >
 *     <motion.div style={{ background: tilt.shine }} />
 *   </motion.div>
 */
export function useCardTilt(intensity = 8) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const ry = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const brightness = useMotionValue(1)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const nx = (e.clientY - r.top) / r.height - 0.5
      const ny = (e.clientX - r.left) / r.width - 0.5
      rx.set(-nx * intensity)
      ry.set(ny * intensity)
      brightness.set(1.05)
      mouseX.set((e.clientX - r.left) / r.width)
      mouseY.set((e.clientY - r.top) / r.height)
    },
    [rx, ry, brightness, mouseX, mouseY, intensity],
  )

  const onLeave = useCallback(() => {
    rx.set(0)
    ry.set(0)
    brightness.set(1)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [rx, ry, brightness, mouseX, mouseY])

  const shineX = useTransform(mouseX, [0, 1], ['0%', '100%'])
  const shineY = useTransform(mouseY, [0, 1], ['0%', '100%'])
  const shine = useMotionTemplate`radial-gradient(400px circle at ${shineX} ${shineY}, rgba(99,102,241,0.12), rgba(139,92,246,0.06), transparent 70%)`
  const borderShine = useMotionTemplate`radial-gradient(300px circle at ${shineX} ${shineY}, rgba(99,102,241,0.5), rgba(139,92,246,0.2), transparent 70%)`

  return { ref, rotateX: rx, rotateY: ry, brightness, shine, borderShine, onMove, onLeave }
}
