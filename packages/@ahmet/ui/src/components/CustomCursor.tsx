'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

export function CustomCursor() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const [isPress, setIsPress] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  // Fareyi takip eden bir nesne doğrudan hareket kaynağıdır — hareket azaltma
  // isteyen kullanıcıda özel imleç hiç çizilmez, sistem imleci geri gelir.
  const reduceMotion = useReducedMotion()

  const dotX  = useMotionValue(-200)
  const dotY  = useMotionValue(-200)
  const ringX = useSpring(dotX, { stiffness: 140, damping: 16 })
  const ringY = useSpring(dotY, { stiffness: 140, damping: 16 })

  const onHoverStart = useCallback((e: MouseEvent) => {
    const t = e.target as HTMLElement
    setIsHover(!!t.closest('a,button,[role="button"]'))
  }, [])

  useEffect(() => {
    setMounted(true)
    if (window.matchMedia('(pointer: coarse)').matches) { setIsTouch(true); return }
    if (reduceMotion) return

    // Sistem imlecini gizleyen CSS kuralı bu kancaya bağlı. Bileşen mount
    // olmadan hiçbir tüketicide imleç kaybolmaz — @ahmetakyapi/theme'i yalnızca
    // token için kuran proje etkilenmez.
    document.documentElement.dataset.customCursor = ''

    const onMove  = (e: MouseEvent) => { dotX.set(e.clientX); dotY.set(e.clientY); setVisible(true) }
    const onDown  = () => setIsPress(true)
    const onUp    = () => setIsPress(false)
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousemove', onHoverStart)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousemove', onHoverStart)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      delete document.documentElement.dataset.customCursor
    }
  }, [dotX, dotY, onHoverStart, reduceMotion])

  if (!mounted || isTouch || reduceMotion) return null

  return (
    <>
      {/*
        Boyut değişimi transform:scale ile yapılır — width/height animasyonu
        her karede layout thrash üretir (impeccable `layout-transition`).
        Ölçek iç katmanda: transition dış motion.div'e konursa x/y takibi de
        gecikir ve imleç fareden geri kalır.
      */}
      <motion.div className="pointer-events-none fixed z-[9999]"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%',
          opacity: visible ? 1 : 0, transition: 'opacity 0.2s', mixBlendMode: 'difference' }}>
        <div className="h-2 w-2 rounded-full bg-ahmet-cyan transition-transform duration-100"
          style={{ transform: `scale(${isPress ? 0.75 : 1})` }} />
      </motion.div>
      <motion.div className="pointer-events-none fixed z-[9998]"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%',
          opacity: visible ? 0.6 : 0, transition: 'opacity 0.2s' }}>
        <div className="h-8 w-8 rounded-full border border-ahmet-cyan/40 transition-transform duration-200"
          style={{ transform: `scale(${isHover ? 1.25 : isPress ? 0.875 : 1})` }} />
      </motion.div>
    </>
  )
}
