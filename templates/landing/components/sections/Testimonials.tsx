'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/variants'
import { GlassCard } from '@/components/ui/GlassCard'

const TESTIMONIALS = [
  {
    name: 'TEST_1_NAME',
    role: 'TEST_1_ROLE',
    avatar: 'TEST_1_AVATAR',    // Baş harfler (2 karakter) — örn. "AK"
    text: 'TEST_1_TEXT',
    stars: 5,
  },
  {
    name: 'TEST_2_NAME',
    role: 'TEST_2_ROLE',
    avatar: 'TEST_2_AVATAR',
    text: 'TEST_2_TEXT',
    stars: 5,
  },
  {
    name: 'TEST_3_NAME',
    role: 'TEST_3_ROLE',
    avatar: 'TEST_3_AVATAR',
    text: 'TEST_3_TEXT',
    stars: 5,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Başlık */}
        <div className="mb-16 text-center">
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
          >
            TEST_TITLE
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-lg text-slate-500 dark:text-slate-400"
          >
            TEST_SUBTITLE
          </motion.p>
        </div>

        {/* Kartlar */}
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <GlassCard className="flex flex-col gap-4 p-6">
                {/* Yıldızlar */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Metin */}
                <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Kişi */}
                <div className="flex items-center gap-3 border-t border-slate-800/40 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
