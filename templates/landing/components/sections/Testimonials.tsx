'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'

const TESTIMONIALS = [
  {
    id: 't1',
    name:     'Alex Morgan',
    role:     'Head of Product, Vercel',
    initials: 'AM',
    gradient: 'from-indigo-500 to-violet-600',
    text:     'We replaced three different tools with Pulse. The real-time view alone saved us hours every week during our last launch.',
    stars: 5,
  },
  {
    id: 't2',
    name:     'Berk Kaya',
    role:     'CTO, Linear',
    initials: 'BK',
    gradient: 'from-cyan-500 to-blue-600',
    text:     'Setup took fifteen minutes, not two sprints. Our whole engineering team looks at the same dashboard now — no more data silos.',
    stars: 5,
  },
  {
    id: 't3',
    name:     'Maya Chen',
    role:     'Growth Lead, Notion',
    initials: 'MC',
    gradient: 'from-emerald-500 to-teal-600',
    text:     'The funnel builder is so intuitive. I stopped needing to ask engineers for custom queries — I just build what I need myself.',
    stars: 5,
  },
] as const

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div variants={fadeUp} className="mb-4 flex justify-center">
            <span className="chip">Testimonials</span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
          >
            Loved by product teams
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto max-w-lg text-slate-500 dark:text-slate-400">
            From early-stage startups to growth-stage companies — teams trust Pulse to answer their hardest questions.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.id}
              variants={{
                hidden:  { opacity: 0, y: 28 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
              className="glass relative flex flex-col overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Quote icon */}
              <Quote className="mb-4 h-6 w-6 text-indigo-500/40" />

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  // Star ratings are positional — index key is appropriate here
                  // eslint-disable-next-line react/no-array-index-key
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Person */}
              <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-bold text-white shadow-md`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
