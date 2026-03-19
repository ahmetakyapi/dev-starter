'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useMagnetic } from '@/hooks/useMagnetic'
import { fadeUp, staggerContainer, EASE } from '@/lib/variants'

// ─── Dashboard Mockup Data ────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Users',  value: '24,891', trend: '+12.4%' },
  { label: 'Revenue',      value: '$48.2K', trend: '+8.1%'  },
  { label: 'Active Now',   value: '1,294',  trend: '+3.2%'  },
  { label: 'Conversion',   value: '3.8%',   trend: '+0.6%'  },
] as const

const CHART_BARS = [
  { id: 'jan-w1', h: 22 }, { id: 'jan-w2', h: 38 }, { id: 'feb-w1', h: 30 },
  { id: 'feb-w2', h: 52 }, { id: 'mar-w1', h: 42 }, { id: 'mar-w2', h: 67 },
  { id: 'apr-w1', h: 50 }, { id: 'apr-w2', h: 80 }, { id: 'may-w1', h: 60 },
  { id: 'may-w2', h: 88 }, { id: 'jun-w1', h: 70 }, { id: 'jun-w2', h: 95 },
  { id: 'jul-w1', h: 76 }, { id: 'jul-w2', h: 100 },
]

const SIDEBAR_NAV = ['Overview', 'Analytics', 'Customers', 'Settings']

const ACTIVITIES = [
  { label: 'New signup',   dot: 'bg-emerald-400', time: '2m ago'  },
  { label: 'Payment',      dot: 'bg-indigo-400',  time: '8m ago'  },
  { label: 'Plan upgrade', dot: 'bg-cyan-400',    time: '15m ago' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────
export default function Hero() {
  const spotlight  = useSpotlight()
  const primaryMag = useMagnetic(0.28)
  const ghostMag   = useMagnetic(0.2)

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center">

      {/* Mouse spotlight */}
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{ background: spotlight }} />

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 hidden bg-grid-dark [background-size:64px_64px] dark:block" />
      <div className="pointer-events-none absolute inset-0 bg-grid-light [background-size:64px_64px] dark:hidden" />

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute -left-64 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute -right-64 top-1/3 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/3 blur-[80px]" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-5xl"
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <span className="chip inline-flex items-center gap-2.5 text-sm">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-semibold text-emerald-400">What&apos;s new</span>
            <span className="h-3.5 w-px bg-slate-600/60" />
            <span className="text-slate-400">Dashboard v2.0 is live</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="mb-5 text-5xl font-black leading-[1.03] tracking-[-0.03em] text-slate-900 dark:text-slate-50 sm:text-6xl lg:text-7xl xl:text-[82px]"
        >
          Know your product,
          <br />
          <span className="text-gradient">grow with</span>
          {' '}confidence
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mb-10 max-w-xl text-lg leading-[1.75] text-slate-500 dark:text-slate-400"
        >
          Pulse turns raw events into clear insights. Track users, revenue and engagement — from one beautiful dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          className="mb-20 flex flex-wrap items-center justify-center gap-3"
        >
          {/* Primary — pill with indigo→violet gradient on hover */}
          <motion.a
            href="#features"
            style={{ x: primaryMag.mx, y: primaryMag.my }}
            onMouseMove={primaryMag.onMove}
            onMouseLeave={primaryMag.onLeave}
            whileTap={{ scale: 0.96 }}
            className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Start for free</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </motion.a>

          {/* Ghost — glass pill with play icon */}
          <motion.a
            href="#how"
            style={{ x: ghostMag.mx, y: ghostMag.my }}
            onMouseMove={ghostMag.onMove}
            onMouseLeave={ghostMag.onLeave}
            whileTap={{ scale: 0.96 }}
            className="group glass flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-slate-400 transition-all hover:text-slate-100"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-white/15">
              <Play className="h-2.5 w-2.5 fill-current" />
            </span>
            <span>Watch demo</span>
          </motion.a>
        </motion.div>

        {/* ── Product Preview ──────────────────────────────────────────────── */}
        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 56, scale: 0.97 },
            visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.9, ease: EASE, delay: 0.32 } },
          }}
          className="relative mx-auto"
        >
          {/* Soft glow beneath frame */}
          <div className="absolute inset-x-16 -top-4 h-16 bg-indigo-600/20 blur-3xl" />

          {/* Browser shell */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 shadow-2xl shadow-slate-300/50 backdrop-blur-xl dark:border-white/[0.06] dark:bg-transparent dark:shadow-black/50 dark:[background:linear-gradient(180deg,rgba(8,12,22,0.72),rgba(6,10,18,0.46))]">

            {/* Browser bar */}
            <div className="flex items-center gap-3 border-b border-slate-200/70 bg-slate-100/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <div className="flex flex-shrink-0 gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80 dark:bg-rose-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80 dark:bg-amber-400/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-400/50" />
              </div>
              <div className="flex flex-1 justify-center">
                <div className="flex w-48 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 dark:bg-emerald-400/70" />
                  <span className="font-mono text-[10px] text-slate-500">app.pulse.io</span>
                </div>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="grid min-h-[300px] grid-cols-[160px_1fr] divide-x divide-slate-200/60 bg-slate-800/90 sm:min-h-[340px] lg:min-h-[380px] lg:grid-cols-[200px_1fr] dark:divide-white/[0.04] dark:bg-[#060a12]/60">

              {/* Sidebar */}
              <div className="space-y-0.5 p-3">
                <div className="mb-5 flex items-center gap-2 px-2 pt-1">
                  <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <div className="h-2.5 w-16 rounded-sm bg-white/10" />
                </div>
                {SIDEBAR_NAV.map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                      i === 0 ? 'bg-indigo-500/12 ring-1 ring-inset ring-indigo-500/20' : ''
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded-sm ${i === 0 ? 'bg-indigo-400/50' : 'bg-white/[0.08]'}`} />
                    <span className={`text-xs ${i === 0 ? 'font-medium text-indigo-300' : 'text-slate-500'}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className="space-y-3 p-4">

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {STATS.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2.5"
                    >
                      <p className="mb-1 text-[9px] text-slate-500">{s.label}</p>
                      <p className="mb-1 text-sm font-bold leading-none text-slate-100">{s.value}</p>
                      <p className="text-[9px] font-semibold text-emerald-400">{s.trend}</p>
                    </div>
                  ))}
                </div>

                {/* Chart + activity */}
                <div className="grid grid-cols-[1fr_100px] gap-2 lg:grid-cols-[1fr_130px]">

                  {/* Bar chart */}
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-slate-300">Revenue</p>
                      <div className="flex gap-1">
                        <span className="rounded px-1.5 py-0.5 bg-indigo-500/20 text-[9px] font-medium text-indigo-300">7D</span>
                        <span className="rounded px-1.5 py-0.5 text-[9px] text-slate-600">30D</span>
                      </div>
                    </div>
                    <div className="flex h-14 items-end gap-0.5">
                      {CHART_BARS.map(({ id, h }, i) => (
                        <div
                          key={id}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background: i >= CHART_BARS.length - 2
                              ? 'linear-gradient(to top, rgba(99,102,241,0.95), rgba(139,92,246,0.65))'
                              : `rgba(99,102,241,${0.08 + i * 0.015})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Activity feed */}
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <p className="mb-2.5 text-[10px] font-medium text-slate-300">Activity</p>
                    <div className="space-y-2.5">
                      {ACTIVITIES.map((a) => (
                        <div key={a.label} className="flex items-start gap-1.5">
                          <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.dot}`} />
                          <div>
                            <p className="text-[9px] leading-tight text-slate-400">{a.label}</p>
                            <p className="text-[9px] text-slate-600">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
