'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'
import { useMagnetic } from '@/hooks/useMagnetic'

export default function CTA() {
  const mag = useMagnetic(0.28)

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 pb-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="glass relative overflow-hidden rounded-3xl px-8 py-24 text-center"
      >
        {/* Radial glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/12 blur-[80px]" />
          <div className="absolute -left-20 top-1/3 h-44 w-44 rounded-full bg-cyan-500/8 blur-[40px]" />
          <div className="absolute -right-20 top-1/3 h-44 w-44 rounded-full bg-violet-500/8 blur-[40px]" />
        </div>

        {/* Accent lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-6 flex justify-center">
          <span className="chip gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Start for free</span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={fadeUp}
          className="mb-4 text-4xl font-black tracking-[-0.02em] text-slate-900 dark:text-slate-50 sm:text-5xl lg:text-6xl"
        >
          Your data deserves better
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mx-auto mb-10 max-w-md text-slate-500 dark:text-slate-400"
        >
          Join 14,000+ teams who use Pulse to understand their users and ship with confidence.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {/* Primary pill with gradient on hover */}
          <motion.a
            href="#"
            style={{ x: mag.mx, y: mag.my }}
            onMouseMove={mag.onMove}
            onMouseLeave={mag.onLeave}
            whileTap={{ scale: 0.96 }}
            className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-indigo-600 px-8 py-4 font-semibold text-white shadow-2xl shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Create free account</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </motion.a>

          {/* Ghost link */}
          <a
            href="#features"
            className="rounded-full px-8 py-4 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Browse features
          </a>
        </motion.div>

        {/* Fine print */}
        <motion.p
          variants={{
            hidden:  { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.5, ease: EASE, delay: 0.4 } },
          }}
          className="mt-6 text-xs text-slate-600"
        >
          No credit card required · Free forever plan · Cancel anytime
        </motion.p>
      </motion.div>
    </section>
  )
}
