'use client'

import { motion } from 'framer-motion'
import { useRef, useCallback } from 'react'
import { useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'

// Özellik listesini doldur
const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: '⚡', title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC' },
  { icon: '🎨', title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC' },
  { icon: '🔒', title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC' },
  { icon: '📊', title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC' },
  { icon: '🌐', title: 'FEATURE_5_TITLE', desc: 'FEATURE_5_DESC' },
  { icon: '🚀', title: 'FEATURE_6_TITLE', desc: 'FEATURE_6_DESC' },
]

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const ry = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8)
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8)
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }, [rx, ry, mx, my])

  const onLeave = useCallback(() => {
    rx.set(0); ry.set(0); mx.set(0.5); my.set(0.5)
  }, [rx, ry, mx, my])

  const shineX = useTransform(mx, [0, 1], ['0%', '100%'])
  const shineY = useTransform(my, [0, 1], ['0%', '100%'])
  const shine  = useMotionTemplate`radial-gradient(360px circle at ${shineX} ${shineY}, rgba(99,102,241,0.10), transparent 70%)`

  return (
    <motion.div
      ref={ref}
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      {/* Holografik parlaklık */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />

      {/* İkon */}
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xl">
        {icon}
      </div>

      <h3 className="mb-2 font-semibold text-slate-100 dark:text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-28">
      {/* Başlık */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mb-16 text-center"
      >
        <motion.div variants={fadeUp} className="mb-4 flex justify-center">
          <span className="chip">Özellikler</span>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
        >
          FEATURES_TITLE
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto max-w-xl text-slate-500 dark:text-slate-400">
          FEATURES_SUBTITLE
        </motion.p>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </motion.div>
    </section>
  )
}
