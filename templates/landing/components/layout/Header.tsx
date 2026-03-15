'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'

const NAV = [
  { label: 'Özellikler', href: '#features' },
  // { label: 'Fiyat', href: '#pricing' },
  // { label: 'Blog', href: '/blog' },
]

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${scrolled ? 'glass shadow-xl shadow-black/10' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">

          {/* Logo */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 shadow-lg shadow-sky-500/20 transition-shadow group-hover:shadow-sky-500/40">
              <span className="text-xs font-extrabold text-white">P</span>
            </div>
            <span className="text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-500 dark:text-slate-100 dark:group-hover:text-indigo-400">
              PROJECT_NAME
            </span>
          </motion.a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                {n.label}
              </a>
            ))}
          </nav>

          {/* Sağ */}
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Tema"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400">
              {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </button>

            <a href="CTA_LINK"
              className="hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 md:block">
              CTA_PRIMARY
            </a>

            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menü"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 md:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobil menü */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass fixed inset-x-4 top-20 z-40 rounded-2xl p-4 md:hidden"
          >
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
                {n.label}
              </a>
            ))}
            <div className="mt-3 border-t border-slate-700/50 pt-3">
              <a href="CTA_LINK"
                className="block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">
                CTA_PRIMARY
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
