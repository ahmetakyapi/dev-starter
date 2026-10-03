/**
 * Reveal + Stagger — görünüme girince bir kez açılan içerik
 *
 * MotionProvider (LazyMotion + domAnimation, MotionConfig reducedMotion="user")
 * altında çalışır; bu yüzden `m.*`.
 *
 * İKİ KURAL:
 *
 * 1. Hareketi azaltan okuyucuda `initial={false}` KULLANILMAZ. O bayrak
 *    "ilk karede animasyon yok" der ama `whileInView` hedefi yine bekler;
 *    sunucudan `opacity: 0` gelen öğe orada takılı kalır. Bunun yerine
 *    başlangıç hedefi değişir: azaltılmış harekette `initial` doğrudan
 *    görünür durumdur, yani ortada açılacak bir şey kalmaz.
 * 2. Kahraman / LCP öğesi Reveal'e SARILMAZ. Sunucu onu `opacity: 0` ile
 *    basar ve tarayıcı LCP'yi hidrasyon + animasyon bitene kadar ertelenmiş
 *    ölçer. Reveal ekranın altındaki bölümler içindir.
 *
 * JS'siz okuyucu için layout'a şunu ekle (görünmez içerik kalmasın):
 *   <noscript><style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style></noscript>
 *
 * Kullanım:
 *   <Reveal><h2>Bölüm</h2></Reveal>
 *   <Stagger className="grid gap-4 sm:grid-cols-3">
 *     {items.map((it) => <StaggerItem key={it.id}>{it.title}</StaggerItem>)}
 *   </Stagger>
 */

'use client'

import { useSyncExternalStore } from 'react'
import { m } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1] as const
const DUR = { base: 0.28, slow: 0.5 } as const
const STAGGER = 0.06
const VIEWPORT = { once: true, margin: '-80px' } as const

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Hareket tercihi — sonradan değişen tercihi de yakalar (sistem ayarı sayfa
 * açıkken değiştirilirse). Sunucuda `false`: sunucu tercihi bilemez.
 * Şablonda bu hook `hooks/useMotionPreference.ts` olarak var; oradan al.
 */
export function useMotionPreference() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}

// Gecikme `custom` ile gelir: varyantın kendi `transition`ı bileşenin
// `transition` prop'unu ezer, prop'a yazılan gecikme hiç uygulanmazdı
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE, delay },
  }),
}

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Saniye — aynı satırdaki ikinci öğe birincinin ardından gelsin diye */
  delay?: number
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useMotionPreference()
  return (
    <m.div
      data-reveal
      className={className}
      variants={fadeUp}
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={VIEWPORT}
      custom={delay}
    >
      {children}
    </m.div>
  )
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
}

type StaggerProps = {
  children: React.ReactNode
  className?: string
}

export function Stagger({ children, className }: StaggerProps) {
  const reduce = useMotionPreference()
  return (
    <m.div
      className={className}
      variants={container}
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </m.div>
  )
}

/** Stagger'ın çocuğu: kendi `whileInView`'ı yok, zamanlamayı kaptan alır. */
export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <m.div data-reveal className={className} variants={item}>
      {children}
    </m.div>
  )
}
