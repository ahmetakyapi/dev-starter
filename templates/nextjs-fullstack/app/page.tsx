'use client'

import { motion } from 'framer-motion'
import { Zap, Palette, Database } from 'lucide-react'
import { useSpotlight } from '@/hooks/useSpotlight'
import { fadeUp, staggerContainer } from '@/lib/variants'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/CustomCursor'

export default function Home() {
  const spotlight = useSpotlight()

  return (
    <>
      <CustomCursor />
      <Header />

      <main className="relative min-h-screen overflow-hidden">
        {/* Spotlight overlay */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: spotlight }}
        />

        {/* Hero */}
        <section className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-6 flex justify-center">
              <span className="chip">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Projeye hoş geldin
              </span>
            </motion.div>

            {/* Başlık */}
            <motion.h1
              variants={fadeUp}
              className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl"
            >
              PROJECT_NAME{' '}
              <span className="text-accent">başladı</span>
            </motion.h1>

            {/* Alt yazı */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400"
            >
              PROJECT_DESCRIPTION
            </motion.p>

            {/* CTA Butonları */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95">
                Başla
              </button>
              <button className="glass rounded-xl px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:text-slate-900 active:scale-95 dark:text-slate-300 dark:hover:text-white">
                Daha Fazla
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {FEATURES.map(({ title, desc, icon: Icon }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="glass rounded-2xl p-6"
              >
                <Icon className="mb-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  )
}

// İkonlar lucide-react — emoji cross-platform tutarsız render ediliyor (uiux-agent kuralı)
const FEATURES = [
  {
    icon: Zap,
    title: 'Hızlı Başlangıç',
    desc: 'Next.js 14 App Router, Tailwind CSS ve Drizzle ORM ile hazır.',
  },
  {
    icon: Palette,
    title: 'Tema Sistemi',
    desc: 'Dark/light mode, glassmorphism ve tutarlı animasyon sistemi.',
  },
  {
    icon: Database,
    title: 'Veritabanı Hazır',
    desc: 'Neon Postgres + Drizzle ORM — serverless için optimize.',
  },
] as const
