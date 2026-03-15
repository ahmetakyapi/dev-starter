'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/variants'

export default function CTA() {
  return (
    <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="glass overflow-hidden rounded-3xl p-12 text-center"
      >
        {/* Arka plan glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5" />

        <motion.h2
          variants={fadeUp}
          className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
        >
          CTA_TITLE
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mx-auto mb-10 max-w-lg text-slate-500 dark:text-slate-400"
        >
          CTA_SUBTITLE
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="CTA_LINK"
            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95"
          >
            CTA_BUTTON
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
