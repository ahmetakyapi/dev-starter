'use client'

import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/variants'
import { GlassCard } from '@/components/ui/GlassCard'

const PLANS = [
  {
    name: 'PLAN_FREE_NAME',
    price: 'PLAN_FREE_PRICE',
    period: 'PLAN_FREE_PERIOD',
    description: 'PLAN_FREE_DESC',
    features: [
      'PLAN_FREE_F1',
      'PLAN_FREE_F2',
      'PLAN_FREE_F3',
    ],
    cta: 'PLAN_FREE_CTA',
    ctaHref: 'CTA_LINK',
    highlight: false,
  },
  {
    name: 'PLAN_PRO_NAME',
    price: 'PLAN_PRO_PRICE',
    period: 'PLAN_PRO_PERIOD',
    description: 'PLAN_PRO_DESC',
    features: [
      'PLAN_PRO_F1',
      'PLAN_PRO_F2',
      'PLAN_PRO_F3',
      'PLAN_PRO_F4',
      'PLAN_PRO_F5',
    ],
    cta: 'PLAN_PRO_CTA',
    ctaHref: 'CTA_LINK',
    highlight: true,
  },
  {
    name: 'PLAN_ENT_NAME',
    price: 'PLAN_ENT_PRICE',
    period: 'PLAN_ENT_PERIOD',
    description: 'PLAN_ENT_DESC',
    features: [
      'PLAN_ENT_F1',
      'PLAN_ENT_F2',
      'PLAN_ENT_F3',
      'PLAN_ENT_F4',
    ],
    cta: 'PLAN_ENT_CTA',
    ctaHref: 'CTA_LINK',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Başlık */}
        <div className="mb-16 text-center">
          <motion.div variants={fadeUp} className="mb-4 flex justify-center">
            <span className="chip">
              <Zap className="h-3 w-3" />
              PRICING_BADGE
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
          >
            PRICING_TITLE
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-lg text-slate-500 dark:text-slate-400"
          >
            PRICING_SUBTITLE
          </motion.p>
        </div>

        {/* Kartlar */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <motion.div key={plan.name} variants={fadeUp}>
              <GlassCard
                glow={plan.highlight}
                className={`flex h-full flex-col p-8 ${
                  plan.highlight
                    ? 'ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : ''
                }`}
              >
                {plan.highlight && (
                  <div className="mb-4 inline-flex self-start">
                    <span className="chip bg-indigo-500/15 text-indigo-400">
                      En Popüler
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-500">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.ctaHref}
                  className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all active:scale-95 ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500'
                      : 'border border-slate-700/50 text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300'
                  }`}
                >
                  {plan.cta}
                </a>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
