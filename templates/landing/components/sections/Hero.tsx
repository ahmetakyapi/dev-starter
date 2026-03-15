'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useMagnetic } from '@/hooks/useMagnetic'
import { fadeUp, staggerContainer } from '@/lib/variants'

export default function Hero() {
  const spotlight = useSpotlight()
  const magnetic  = useMagnetic(0.3)

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-6 text-center">

      {/* Spotlight */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: spotlight }}
      />

      {/* Izgara arka plan */}
      <div className="pointer-events-none absolute inset-0 bg-grid-dark dark:bg-grid-dark [background-size:64px_64px] opacity-100 hidden dark:block" />
      <div className="pointer-events-none absolute inset-0 bg-grid-light [background-size:64px_64px] opacity-100 dark:hidden" />

      {/* İçerik */}
      <motion.div
        className="relative z-10 max-w-4xl"
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <span className="chip">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            BADGE_TEXT
          </span>
        </motion.div>

        {/* Başlık */}
        <motion.h1
          variants={fadeUp}
          className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl lg:text-7xl"
        >
          HERO_TITLE_LINE1{' '}
          <span className="text-gradient">
            HERO_TITLE_GRADIENT
          </span>
        </motion.h1>

        {/* Alt yazı */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500 dark:text-slate-400"
        >
          HERO_SUBTITLE
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.a
            href="#features"
            style={{ x: magnetic.mx, y: magnetic.my }}
            onMouseMove={magnetic.onMove}
            onMouseLeave={magnetic.onLeave}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40"
          >
            CTA_PRIMARY
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.a>

          <a
            href="https://github.com/ahmetakyapi"
            target="_blank"
            rel="noopener noreferrer"
            className="glass flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:text-white"
          >
            CTA_SECONDARY
          </a>
        </motion.div>
      </motion.div>

      {/* Aşağı ok */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-slate-600/40 p-1.5">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="h-2 w-1 rounded-full bg-slate-400"
          />
        </div>
      </motion.div>
    </section>
  )
}
