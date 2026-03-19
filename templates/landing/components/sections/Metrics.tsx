'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'

const METRICS = [
  { id: 'm1', value: 'METRIC_1_VALUE', label: 'METRIC_1_LABEL', trend: 'METRIC_1_TREND' },
  { id: 'm2', value: 'METRIC_2_VALUE', label: 'METRIC_2_LABEL', trend: 'METRIC_2_TREND' },
  { id: 'm3', value: 'METRIC_3_VALUE', label: 'METRIC_3_LABEL', trend: 'METRIC_3_TREND' },
  { id: 'm4', value: 'METRIC_4_VALUE', label: 'METRIC_4_LABEL', trend: 'METRIC_4_TREND' },
] as const

export default function Metrics() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 28 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
          }}
          className="glass relative overflow-hidden rounded-3xl px-8 py-12"
        >
          {/* Background glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-56 w-56 translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/8 blur-3xl" />
          </div>

          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.id}
                variants={fadeUp}
                className={`text-center ${
                  i < METRICS.length - 1 ? 'lg:border-r lg:border-white/[0.06]' : ''
                }`}
              >
                <p className="mb-1 text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">
                  {m.value}
                </p>
                <p className="mb-3 text-sm text-slate-400">{m.label}</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">{m.trend}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
