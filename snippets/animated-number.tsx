/**
 * Animated Number — Sayı animasyonu
 *
 * Sayı değiştiğinde yukarı/aşağı kayan animasyon.
 * Finance dashboard'ları, istatistik kartları için.
 *
 * Kullanım:
 *   <AnimatedNumber value={1337} prefix="$" suffix=" USD" decimals={2} />
 *   <AnimatedNumber value={count} className="text-4xl font-bold" />
 */

'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`,
  )

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return (
    <motion.span
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums', ...({ style: display } as object) }}
    >
      {display}
    </motion.span>
  )
}
