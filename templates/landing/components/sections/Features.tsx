'use client'

import { motion } from 'framer-motion'
import { Cpu, Zap, Shield, BarChart3, Globe } from 'lucide-react'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'
import { useCardTilt } from '@/hooks/useCardTilt'

// ─── Types ────────────────────────────────────────────────────────────────────
type FeatureDef = {
  id: string
  icon: typeof Cpu
  iconBg: string
  iconColor: string
  title: string
  desc: string
  size: 'lg' | 'sm'
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES: FeatureDef[] = [
  {
    id: 'f1',
    icon: Cpu,
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    iconColor: 'text-indigo-400',
    title: 'FEATURE_1_TITLE',
    desc: 'FEATURE_1_DESC',
    size: 'lg',
  },
  {
    id: 'f2',
    icon: Zap,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    title: 'FEATURE_2_TITLE',
    desc: 'FEATURE_2_DESC',
    size: 'sm',
  },
  {
    id: 'f3',
    icon: Shield,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'FEATURE_3_TITLE',
    desc: 'FEATURE_3_DESC',
    size: 'sm',
  },
  {
    id: 'f4',
    icon: BarChart3,
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    iconColor: 'text-cyan-400',
    title: 'FEATURE_4_TITLE',
    desc: 'FEATURE_4_DESC',
    size: 'sm',
  },
  {
    id: 'f5',
    icon: Globe,
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    iconColor: 'text-violet-400',
    title: 'FEATURE_5_TITLE',
    desc: 'FEATURE_5_DESC',
    size: 'sm',
  },
]

// Mini chart bars inside the large card (decorative)
const MINI_BARS = [
  { id: 'mb-1', h: 40 }, { id: 'mb-2', h: 65 }, { id: 'mb-3', h: 50 },
  { id: 'mb-4', h: 80 }, { id: 'mb-5', h: 55 }, { id: 'mb-6', h: 90 },
  { id: 'mb-7', h: 68 }, { id: 'mb-8', h: 100 }, { id: 'mb-9', h: 74 },
  { id: 'mb-10', h: 88 }, { id: 'mb-11', h: 62 }, { id: 'mb-12', h: 95 },
]

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, className = '' }: Readonly<{ feature: FeatureDef; className?: string }>) {
  const { ref, rx, ry, shine, onMove, onLeave } = useCardTilt(6)
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden:  { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`glass relative overflow-hidden rounded-2xl p-7 transition-shadow hover:shadow-xl hover:shadow-indigo-500/5 ${className}`}
    >
      {/* Holographic shine */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Icon */}
      <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${feature.iconBg}`}>
        <Icon className={`h-5 w-5 ${feature.iconColor}`} />
      </div>

      <h3 className="mb-2.5 text-[15px] font-semibold text-slate-100">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{feature.desc}</p>

      {/* Large card: decorative mini-chart preview */}
      {feature.size === 'lg' && (
        <div className="mt-7 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 rounded-sm bg-white/10" />
              <div className="h-1.5 w-10 rounded-sm bg-white/[0.06]" />
            </div>
            <div className="flex gap-1">
              <div className="rounded px-2 py-0.5 bg-indigo-500/20 text-[9px] font-medium text-indigo-300">Live</div>
            </div>
          </div>
          <div className="flex h-16 items-end gap-1">
            {MINI_BARS.map(({ id, h }, i) => (
              <div
                key={id}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: i >= MINI_BARS.length - 3
                    ? `rgba(99,102,241,${0.5 + (i - MINI_BARS.length + 3) * 0.2})`
                    : `rgba(99,102,241,${0.08 + i * 0.018})`,
                }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            {['Jan', 'Mar', 'May', 'Jul'].map((m) => (
              <span key={m} className="text-[9px] text-slate-600">{m}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function Features() {
  const [large, ...small] = FEATURES

  return (
    <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-28">

      {/* Section header */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mb-16 text-center"
      >
        <motion.div variants={fadeUp} className="mb-4 flex justify-center">
          <span className="chip">Features</span>
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

      {/* Bento grid
          sm (2-col): large spans full width, smalls fill below
          lg (3-col): large spans 2 cols, first small fills col 3, remaining 3 fill row 2
      */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FeatureCard feature={large} className="sm:col-span-2 lg:col-span-2" />
        {small.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </motion.div>
    </section>
  )
}
