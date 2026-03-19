'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'

const NAV = [
  { label: 'Features',     href: '#features' },
  { label: 'How it works', href: '#how'      },
  { label: 'Pricing',      href: '#pricing'  },
]

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled,  setScrolled]   = useState(false)
  const [menuOpen,  setMenuOpen]   = useState(false)
  const [mounted,   setMounted]    = useState(false)

  useEffect(() => {
    setMounted(true)
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-3' : 'py-4'
        }`}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 ${
              scrolled ? 'glass shadow-xl shadow-black/10' : 'bg-transparent'
            }`}
          >
            {/* Logo */}
            <motion.a
              href="/"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/20 transition-shadow group-hover:shadow-indigo-500/40">
                <span className="text-[10px] font-black text-white">P</span>
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                PROJECT_NAME
              </span>
            </motion.a>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-0.5 md:flex">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {n.label}
                </motion.a>
              ))}
            </nav>

            {/* Right actions */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100"
              >
                {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
              </button>

              {/* CTA — pill */}
              <a
                href="#contact"
                className="hidden items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 md:flex"
              >
                Get started
              </a>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 md:hidden"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass fixed inset-x-4 top-20 z-40 rounded-2xl p-3 shadow-xl shadow-black/20 md:hidden"
          >
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 border-t border-white/[0.06] pt-2">
              <a
                href="#contact"
                className="block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
