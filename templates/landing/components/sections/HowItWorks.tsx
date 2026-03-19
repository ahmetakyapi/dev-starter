'use client'

import { motion } from 'framer-motion'
import { PlugZap, Workflow, Rocket } from 'lucide-react'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'

const STEPS = [
  {
    id: 'step-1',
    number: '01',
    icon: PlugZap,
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    iconColor: 'text-indigo-400',
    glowColor: 'bg-indigo-500/10',
    title: 'Connect your app',
    desc:  'Paste one script tag or install the npm package. Works with any framework — React, Vue, Next.js, plain HTML.',
  },
  {
    id: 'step-2',
    number: '02',
    icon: Workflow,
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    iconColor: 'text-cyan-400',
    glowColor: 'bg-cyan-500/10',
    title: 'Define your funnels',
    desc:  'Tell Pulse which events matter. Our visual builder makes it easy — no SQL, no config files, no engineer needed.',
  },
  {
    id: 'step-3',
    number: '03',
    icon: Rocket,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    glowColor: 'bg-emerald-500/10',
    title: 'Ship with confidence',
    desc:  'Get alerts when conversion drops, share live reports with your team, and iterate on what actually works.',
  },
] as const

export default function HowItWorks() {
  return (
    <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-28">

      {/* Section header */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mb-20 text-center"
      >
        <motion.div variants={fadeUp} className="mb-4 flex justify-center">
          <span className="chip">How it works</span>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl"
        >
          Up and running in minutes
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto max-w-lg text-slate-500 dark:text-slate-400">
          No complex setup, no engineering bottlenecks. Paste one script tag and start seeing data in seconds.
        </motion.p>
      </motion.div>

      {/* Steps */}
      <div className="relative">

        {/* Connector line — desktop only, sits behind the step circles */}
        <div
          className="absolute left-0 right-0 top-[52px] hidden h-px lg:block"
          style={{
            background: 'linear-gradient(to right, transparent 2%, rgba(99,102,241,0.18) 20%, rgba(99,102,241,0.18) 80%, transparent 98%)',
          }}
        />

        <motion.div
          variants={staggerContainer(0.14)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-3"
        >
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                variants={{
                  hidden:  { opacity: 0, y: 32 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
                }}
                className="flex flex-col items-center text-center"
              >
                {/* Circle with icon */}
                <div className="relative mb-8">
                  {/* Glow ring */}
                  <div className={`absolute inset-0 scale-150 rounded-full ${step.glowColor} blur-2xl`} />

                  {/* Outer ring */}
                  <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-slate-50 to-white dark:border-white/[0.08] dark:from-white/[0.05] dark:to-white/[0.02]">
                    {/* Step number — top-right inside ring */}
                    <span className="absolute right-3 top-3 font-mono text-[10px] font-bold text-indigo-400/60">
                      {step.number}
                    </span>

                    {/* Icon tile */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${step.iconBg}`}>
                      <Icon className={`h-6 w-6 ${step.iconColor}`} />
                    </div>
                  </div>
                </div>

                <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.desc}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
