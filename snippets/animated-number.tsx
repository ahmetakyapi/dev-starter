/**
 * Animated Number — değer DEĞİŞİNCE yaya bağlı sayan sayı
 *
 * Panolarda canlı güncellenen değerler için (sayaç, toplam). İlk yüklemede
 * oynayan display sayısı için `rolling-number.tsx` (JS'siz, sunucuda
 * çizilir) daha doğru: bu bileşen hidrasyonu bekler ve ara karelerde
 * yarım değerler basar.
 *
 * Hareketi azaltan okuyucuda yay atlanır, değer doğrudan yazılır.
 * Ekran okuyucu ara kareleri değil son değeri okur (sr-only kopya).
 *
 * Kullanım:
 *   <AnimatedNumber value={1337} suffix=" ₺" decimals={2} />
 *   <AnimatedNumber value={count} className="text-display font-bold" />
 */

'use client'

import { useEffect, useMemo } from 'react'
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

type AnimatedNumberProps = {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

const SPRING = { stiffness: 100, damping: 20 } as const

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion()
  const target = useMotionValue(value)
  const spring = useSpring(target, SPRING)

  const format = useMemo(() => {
    const nf = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return (v: number) => `${prefix}${nf.format(v)}${suffix}`
  }, [prefix, suffix, decimals])

  const display = useTransform(spring, format)

  useEffect(() => {
    if (reduceMotion) spring.jump(value)
    else target.set(value)
  }, [value, reduceMotion, target, spring])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span className="sr-only">{format(value)}</span>
      <m.span aria-hidden>{display}</m.span>
    </span>
  )
}
