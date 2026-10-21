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
 *      büyüyen bir daireyle açar (`::view-transition-new(root)` +
 *      `--vt-x` / `--vt-y`). Kural şablonda `app/globals.css`te
 *      `html.theme-switching` altında, pakette @ahmetakyapi/theme/css'te.
 *
 * Hareketi azaltan okuyucuda geçiş atlanır, tema anında değişir.
 * Şablonun `components/ui/ThemeToggle.tsx`iyle aynı davranış.
 *
 * Çerez İSTEMCİDE yazılır, server action ile değil: action içindeki
 * `cookies().set()` bütün sayfayı sunucuda yeniden çizdirir ve istemcinin
 * ön yükleme önbelleğini boşaltır; kozmetik bir tıklama için fazla. Değer
 * gizli değil, httpOnly gerekmez.
 *
 * Kullanım (sunucu bileşeninde):
 *   <ThemeToggle initial={await getTheme()} />
 */

'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'dark' | 'light'

const THEME_COOKIE = 'theme'
const ONE_YEAR = 60 * 60 * 24 * 365

function writeCookie(theme: Theme) {
  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax${secure}`
}

// Tema `<html data-theme>`te yaşar; düğme onu DİNLER, kendi durumunu tutmaz.
// Kendi durumu olsaydı başlıktaki ve sonradan açılan çekmecedeki iki düğme
// ayrışır, eski `initial`la açılan düğmenin ilk tıklaması boşa giderdi.
function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

// Üst üste iki tıklamada sınıfı yalnızca SON geçiş kaldırır; yoksa ilk
// geçişin bitişi ikincisi oynarken sınıfı siler ve tarayıcının varsayılan
// çapraz solması araya girer
let activeTransition: ViewTransition | null = null

export function ThemeToggle({ initial, className }: { initial: Theme; className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => initial)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement
    // Abonelik ikonu aynı görevde yeniden çizer; flushSync gerekmez
    // Tarayıcı çubuğu (`meta[name=theme-color]`) da yeni zemine geçer; değer
    // token'dan okunur, palet değişince burada ikinci bir hex bayatlamasın
    const apply = () => {
      root.dataset.theme = next
      const bg = getComputedStyle(root).getPropertyValue('--page-bg').trim()
      if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
    }
    writeCookie(next)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof document.startViewTransition !== 'function') {
      apply()
      return
    }
    // Klavyeyle tetiklenen tıklamada koordinat yok (detail 0): düğmenin ortası
    const box = e.currentTarget.getBoundingClientRect()
    const x = e.detail > 0 ? e.clientX : box.left + box.width / 2
    const y = e.detail > 0 ? e.clientY : box.top + box.height / 2
    root.style.setProperty('--vt-x', `${x}px`)
    root.style.setProperty('--vt-y', `${y}px`)
    root.classList.add('theme-switching')

    const transition = document.startViewTransition(apply)
    activeTransition = transition
    void transition.finished.finally(() => {
      if (activeTransition !== transition) return
      activeTransition = null
      root.classList.remove('theme-switching')
    })
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
