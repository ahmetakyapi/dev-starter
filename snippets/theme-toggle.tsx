/**
 * ThemeToggle — çerezli tema değiştirici, dairesel görünüm geçişiyle
 *
 * Tema SUNUCUDA basılır: layout `theme` çerezini okur ve
 * `<html data-theme={theme} suppressHydrationWarning>` yazar. Inline betik
 * yok, ilk karede yanlış tema (FOUC) yok. Bu düğme yalnızca:
 *
 *   1. `<html data-theme>`ı ANINDA değiştirir (sunucuya gidiş beklenmez),
 *   2. çerezi yazar, bir sonraki istek sunucuda doğru temayla çizilsin,
 *   3. `document.startViewTransition` varsa yeni temayı tıklanan noktadan
 *      büyüyen bir daireyle açar (CSS'i @ahmetakyapi/theme/css'te:
 *      `::view-transition-new(root)` + `--vt-x` / `--vt-y`).
 *
 * Hareketi azaltan okuyucuda geçiş atlanır, tema anında değişir.
 *
 * Kullanım (sunucu bileşeninde):
 *   <ThemeToggle initial={await getTheme()} />
 *
 * Çerezi bir server action ile yazmak da olur (`app/actions/theme.ts`);
 * burada `document.cookie` yeterli: değer gizli değil, httpOnly gerekmez.
 */

'use client'

import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'

type Theme = 'dark' | 'light'

const THEME_COOKIE = 'theme'
const ONE_YEAR = 60 * 60 * 24 * 365

function writeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

export function ThemeToggle({ initial, className }: { initial: Theme; className?: string }) {
  const [theme, setTheme] = useState<Theme>(initial)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function apply(value: Theme) {
    // flushSync: görünüm geçişi DOM'un fotoğrafını geri çağrı dönünce çeker;
    // ikon da aynı karede değişmiş olmalı, yoksa eski ikon yeni temada kalır
    flushSync(() => setTheme(value))
    document.documentElement.dataset.theme = value
  }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    writeCookie(next)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof document.startViewTransition !== 'function') {
      apply(next)
      return
    }
    const root = document.documentElement
    root.style.setProperty('--vt-x', `${e.clientX}px`)
    root.style.setProperty('--vt-y', `${e.clientY}px`)
    document.startViewTransition(() => apply(next))
  }

  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={next === 'light' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className={`grid size-11 place-items-center rounded-md text-soft transition-colors hover:bg-surface-raised hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus ${className ?? ''}`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  )
}
