/**
 * Ekosistem sözleşme testleri.
 *
 * Buradaki her assertion, sessizce bozulduğunda HER projeyi etkileyen bir
 * değeri korur. Kapsam genişliği değil, kırılganlık önceliklidir:
 * `rules/bugfix-protocol.md` bir failing test ister ve `gate-agent.md` Pass 4
 * `npm test` çalıştırır — bu dosya ikisini de icra edilebilir kılar.
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  EASE,
  DUR,
  SPRING,
  STAGGER,
  stagger,
  staggerContainer,
} from '../packages/@ahmet/ui/src/variants'
import * as variantModule from '../packages/@ahmet/ui/src/variants'
import { cn } from '../packages/@ahmet/ui/src/utils'
import { animation, gradients, colors, motion, roles, palettes } from '../packages/@ahmet/theme/tokens'

const THEME_CSS = readFileSync(new URL('../packages/@ahmet/theme/theme.css', import.meta.url), 'utf8')
const INDEX_CSS = readFileSync(new URL('../packages/@ahmet/theme/index.css', import.meta.url), 'utf8')

/** theme.css'ten bir seçici bloğunun gövdesini çıkarır (seçici ` {` ile biter) */
function cssBlock(selector: string): string {
  const at = THEME_CSS.indexOf(`${selector} {`)
  if (at === -1) throw new Error(`theme.css'te blok yok: ${selector}`)
  const open = THEME_CSS.indexOf('{', at)
  return THEME_CSS.slice(open + 1, THEME_CSS.indexOf('}', open))
}

function cssVar(block: string, name: string): string | undefined {
  return new RegExp(`${name}:\\s*([^;]+);`).exec(block)?.[1].trim()
}

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
// JS adı → CSS ham değişken adı (pageBg → --page-bg)
const roleVar = (key: string) => `--${kebab(key)}`
const paletteVar = (key: string) => `--palette-${kebab(key)}`

// Seçiciler theme.css'teki sırayla birebir: değiştirirsen özgüllük notunu oku
const SYSTEM_SELECTOR = {
  light: ':root,\n:root[data-theme="light"]',
  dark: ':root[data-theme="dark"]',
} as const

function paletteSelector(name: string, theme: 'light' | 'dark') {
  if (name === 'signature') {
    return theme === 'light'
      ? ':root,\n:root[data-palette="signature"]'
      : ':root[data-theme="dark"],\n:root[data-theme="dark"][data-palette="signature"]'
  }
  return theme === 'light'
    ? `:root[data-palette="${name}"]`
    : `:root[data-theme="dark"][data-palette="${name}"]`
}

// ── WCAG 2.x göreli parlaklık ve kontrast oranı ──────────────────────────
type RGB = [number, number, number]

function parseColor(value: string): { rgb: RGB; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 }
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (rgb) {
    return { rgb: [+rgb[1], +rgb[2], +rgb[3]], alpha: rgb[4] === undefined ? 1 : +rgb[4] }
  }
  throw new Error(`çözülemeyen renk: ${value}`)
}

/** Yarı saydam rengi zeminle harmanlar — wash gerçekte zeminin üstünde görünür.
 *  Zemin zaten harmanlanmış olabilir (wash ∘ kart ∘ sayfa). */
function over(value: string, background: string | RGB): RGB {
  const fg = parseColor(value)
  const bg = typeof background === 'string' ? parseColor(background).rgb : background
  return fg.rgb.map((c, i) => c * fg.alpha + bg[i] * (1 - fg.alpha)) as RGB
}

/** Degradenin hex duraklarını sırayla çıkarır */
function gradientStops(value: string): RGB[] {
  return [...value.matchAll(/#[0-9a-f]{6}/gi)].map((match) => parseColor(match[0]).rgb)
}

function luminance([r, g, b]: RGB) {
  const ch = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

function contrast(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const AA = 4.5
// index.css → .text-on-brand ::selection karışım oranı
const CTA_SELECTION_MIX = 18

describe('imza ease eğrisi', () => {
  // Ekosistemin tek geçiş eğrisi. Değişirse her projedeki her animasyonun
  // karakteri sessizce kayar — hiçbir build hatası vermeden.
  it('[0.22, 1, 0.36, 1] sabit kalır', () => {
    expect(EASE).toEqual([0.22, 1, 0.36, 1])
  })

  it('theme tokenı ile ui varyantları aynı eğriyi paylaşır', () => {
    expect([...animation.ease]).toEqual([...EASE])
  })

  it('tüm hazır giriş varyantları imza eğrisini kullanır', () => {
    // Liste elle yazılmaz, modül taranır: yeni varyant kendiliğinden kapsamda.
    // `exit` bilerek dışarıda: çıkış ease-in (guides/04-motion.md → exitOf).
    // Fabrikalar (stagger, staggerContainer) yalnızca sıralar, eğri taşımaz.
    const entries = Object.entries(variantModule).filter(
      ([, v]) => typeof v === 'object' && v !== null && 'visible' in v,
    )
    expect(entries.map(([name]) => name)).toEqual(expect.arrayContaining(['fadeUp', 'fadeIn', 'modalBackdrop']))
    for (const [name, v] of entries) {
      const t = (v as { visible: { transition?: { ease?: unknown } } }).visible.transition
      expect(t?.ease, name).toEqual(EASE)
    }
  })

  it('motion sözleşmesi: DUR / SPRING / STAGGER theme tokenıyla aynı', () => {
    expect(DUR).toEqual(motion.dur)
    expect(SPRING).toEqual(motion.spring)
    expect(STAGGER).toBe(motion.stagger)
    expect([...motion.ease]).toEqual([...EASE])
  })

  it('stagger() kardeş aralığını STAGGER, gecikmeyi argümandan alır', () => {
    expect(stagger(0.2).visible.transition).toEqual({ staggerChildren: STAGGER, delayChildren: 0.2 })
  })

  it('CSS tarafı da aynı eğriyi kullanır (--ease-brand)', () => {
    expect(THEME_CSS).toContain('--ease-brand: cubic-bezier(0.22, 1, 0.36, 1)')
    expect(THEME_CSS).toContain('--default-transition-timing-function: var(--ease-brand)')
  })

  it('staggerContainer bir fabrikadır ve stagger değerini geçirir', () => {
    const made = staggerContainer(0.2)
    expect(made.visible.transition.staggerChildren).toBe(0.2)
    expect(staggerContainer().visible.transition.staggerChildren).toBe(0.12)
  })
})

describe('cn()', () => {
  it('çakışan Tailwind sınıflarında sonuncusu kazanır', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('koşullu ve falsy değerleri eler', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('çakışmayan sınıfları korur', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  // Rol adlı punto ölçeği tailwind-merge'e kayıtlı değilse `text-small`
  // renk sınıfı sanılır ve `text-strong` onu SİLER — hiçbir hata vermeden.
  it('rol adlı punto ile renk sınıfı birbirini silmez', () => {
    expect(cn('text-small', 'text-strong')).toBe('text-small text-strong')
    expect(cn('text-read text-body', 'text-lead')).toBe('text-body text-lead')
    expect(cn('text-muted', 'text-strong')).toBe('text-strong')
  })
})

describe('imza degradesi', () => {
  // Elle yazılan degradeler "aynı sanılan farklı degradeler" biriktirir —
  // dev-starter'da 5 varyant, onepiece-hub'da 109 token'sız kullanım bulundu.
  // Tek kaynak burası.
  it('tek bir yerden gelir', () => {
    expect(gradients.signature).toBe(
      'linear-gradient(135deg, rgb(99,102,241), rgb(59,130,246), rgb(34,211,238))'
    )
  })

  it('deprecated logo aliası hâlâ çözülür (geriye dönük uyumluluk)', () => {
    expect(gradients.logo).toBeTruthy()
  })
})

describe('palet', () => {
  it('marka vurgu renkleri tanımlı', () => {
    for (const key of ['indigo', 'cyan', 'emerald', 'blue'] as const) {
      expect(colors.accent[key]?.DEFAULT).toBeTruthy()
    }
  })

  it('dark zemin ekosistem değeri #04070d', () => {
    expect(colors.bg.dark).toBe('#04070d')
  })
})

describe('theme.css ↔ tokens.ts', () => {
  // OG görseli CSS değişkeni çözemediği için rengi JS'ten okur. İki kaynak
  // ayrışırsa paylaşılan görsel sitenin renginden sessizce kopar.
  for (const theme of ['light', 'dark'] as const) {
    it(`sistem katmanı (${theme}) roles ile aynı`, () => {
      const block = cssBlock(SYSTEM_SELECTOR[theme])
      expect(cssVar(block, 'color-scheme')).toBe(theme)
      for (const [key, value] of Object.entries(roles[theme])) {
        expect(cssVar(block, roleVar(key)), `${theme} ${roleVar(key)}`).toBe(value)
      }
    })
  }

  for (const name of Object.keys(palettes) as (keyof typeof palettes)[]) {
    for (const theme of ['light', 'dark'] as const) {
      it(`palet ${name} (${theme}) palettes ile aynı`, () => {
        const block = cssBlock(paletteSelector(name, theme))
        for (const [key, value] of Object.entries(palettes[name][theme])) {
          expect(cssVar(block, paletteVar(key)), `${name}/${theme} ${paletteVar(key)}`).toBe(value)
        }
      })
    }
  }

  it('sistem rolleri paletten okur', () => {
    const block = cssBlock(':root')
    expect(cssVar(block, '--primary')).toBe('var(--palette-primary)')
    expect(cssVar(block, '--line-focus')).toBe('var(--palette-primary)')
    expect(cssVar(block, '--brand-gradient')).toBe('var(--palette-brand-gradient)')
    expect(cssVar(block, '--cta-gradient')).toBe('var(--palette-cta-gradient)')
  })

  // Şablonlar ve snippets/ui bu adlarla yazar. Paket köprüsünde yoksa sınıf
  // pakete kurulmuş projede hiç derlenmez: diyalog gölgesiz, CTA zeminsiz
  // kalır ve hiçbir araç uyarmaz.
  it('şablonun sınıf adları paket köprüsünde de var', () => {
    for (const name of [
      '--shadow-raised',
      '--shadow-floating',
      '--shadow-modal',
      '--color-accent-warm',
      '--color-on-brand',
    ]) {
      expect(THEME_CSS, name).toMatch(new RegExp(`@theme inline \\{[^}]*${name}:`))
    }
    expect(THEME_CSS).toMatch(/@utility bg-cta \{\s*background-image: var\(--cta-gradient\)/)
    expect(THEME_CSS).toContain('--text-hero--line-height:')
  })

  it('varsayılan marka signature paletiyle aynı', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(colors.brand[theme].bg).toBe(roles[theme].pageBg)
      expect(colors.brand[theme].primary).toBe(palettes.signature[theme].primary)
      expect(colors.brand[theme].primaryInk).toBe(palettes.signature[theme].primaryInk)
      expect(colors.brand[theme].onPrimary).toBe(palettes.signature[theme].onPrimary)
      expect(colors.brand.displayGradient[theme]).toBe(palettes.signature[theme].displayGradient)
    }
    expect(gradients.brand).toBe(palettes.signature.light.brandGradient)
    // Marka karosu temayı bilemez (sekme ikonu): iki temada aynı
    expect(palettes.signature.dark.brandGradient).toBe(palettes.signature.light.brandGradient)
  })

  it('köprü `@theme inline` — temayla dönen renk tek kez çözülmez', () => {
    expect(THEME_CSS).toMatch(/@theme inline \{[^}]*--color-page: var\(--page-bg\)/)
  })

  it('Google Fonts @import yok (font next/font ile yüklenir)', () => {
    // `url(...)` ve düz dize biçimi ikisi de render'ı bloklar
    const googleFonts = /@import\s+(?:url\(\s*)?['"]?https?:\/\/fonts\.(?:googleapis|gstatic)\.com/
    for (const sample of [
      '@import url("https://fonts.googleapis.com/css2?family=Manrope");',
      '@import url(https://fonts.googleapis.com/css2?family=Manrope);',
      '@import "https://fonts.googleapis.com/css2?family=Manrope";',
    ]) {
      expect(sample).toMatch(googleFonts)
    }
    for (const css of [THEME_CSS, INDEX_CSS]) expect(css).not.toMatch(googleFonts)
  })

  it('seçim zemini wash, metni text-strong (kontrastı aşağıda ölçülür)', () => {
    const selection = /::selection \{([^}]*)\}/.exec(INDEX_CSS)?.[1] ?? ''
    expect(selection).toContain('background: var(--primary-wash)')
    expect(selection).toContain('color: var(--text-strong)')
  })

  // Genel kural dolgulu yüzeyde dolguya düşer: dolgu kendi çiftini taşır
  it('dolgulu yüzeyde seçim dolgunun kendi rengini kullanır', () => {
    const onPrimary = /\.text-on-primary ::selection \{([^}]*)\}/.exec(INDEX_CSS)?.[1] ?? ''
    expect(onPrimary).toContain('background: var(--on-primary)')
    expect(onPrimary).toContain('color: var(--primary)')
    const onBrand = /\.text-on-brand ::selection \{([^}]*)\}/.exec(INDEX_CSS)?.[1] ?? ''
    expect(onBrand).toContain(`background: color-mix(in srgb, var(--on-brand) ${CTA_SELECTION_MIX}%, transparent)`)
    expect(onBrand).toContain('color: var(--on-brand)')
  })

  // İçe alınan halka öğenin kendi zeminine çizilir: dolgulu düğmede dolguyla
  // aynı renk olur. Kırpan kabın HER torununa uygulanan kural odağı siler.
  it('odak halkası yalnızca kartı dolduran öğede ya da .focus-inset ile içeride', () => {
    expect(INDEX_CSS).not.toMatch(/overflow-x-auto\)\s*:focus-visible/)
    expect(INDEX_CSS).toMatch(/\.focus-inset,\s*:where\([^)]*\) \.absolute\.inset-0\s*\):focus-visible \{\s*outline-offset: -2px/)
  })
})

describe('WCAG kontrastı — her palet × tema', () => {
  // Değer uydurulmaz, ölçülür. Geçmeyen palet düzeltilir; eşik gevşetilmez.
  for (const name of Object.keys(palettes) as (keyof typeof palettes)[]) {
    for (const theme of ['light', 'dark'] as const) {
      const p = palettes[name][theme]
      const page = roles[theme].pageBg
      const pageRgb = parseColor(page).rgb

      it(`${name}/${theme}: on-primary / primary ≥ ${AA}`, () => {
        expect(contrast(parseColor(p.onPrimary).rgb, parseColor(p.primary).rgb)).toBeGreaterThanOrEqual(AA)
      })

      it(`${name}/${theme}: primary-ink / page-bg ≥ ${AA}`, () => {
        expect(contrast(parseColor(p.primaryInk).rgb, pageRgb)).toBeGreaterThanOrEqual(AA)
      })

      it(`${name}/${theme}: primary-ink / (wash ∘ page-bg) ≥ ${AA}`, () => {
        expect(contrast(parseColor(p.primaryInk).rgb, over(p.primaryWash, page))).toBeGreaterThanOrEqual(AA)
      })

      // index.css ::selection: seçili metin seçili olmayandan okunaksız olmaz
      it(`${name}/${theme}: seçim — text-strong / (wash ∘ page-bg) ≥ ${AA}`, () => {
        const strong = parseColor(roles[theme].textStrong).rgb
        expect(contrast(strong, over(p.primaryWash, page))).toBeGreaterThanOrEqual(AA)
      })

      // Dışarıdaki halka (`--line-focus` = primary) sayfa zemininde görünür
      it(`${name}/${theme}: odak halkası / page-bg ≥ 3`, () => {
        expect(contrast(parseColor(p.primary).rgb, pageRgb)).toBeGreaterThanOrEqual(3)
      })

      // Seçili CTA metni: beyaz metin, zemin on-brand ile bir tık aydınlanır.
      // Her durakta en az 3:1 (seçim geçici durum; düz CTA zaten AA).
      it(`${name}/${theme}: seçim — on-brand / (on-brand ∘ cta durağı) ≥ 3`, () => {
        const onBrandHex = cssVar(cssBlock(':root'), '--on-brand') ?? ''
        const onBrand = parseColor(onBrandHex).rgb
        for (const stop of gradientStops(p.ctaGradient)) {
          const mixed = onBrand.map((c, i) => c * (CTA_SELECTION_MIX / 100) + stop[i] * (1 - CTA_SELECTION_MIX / 100)) as RGB
          expect(contrast(onBrand, mixed)).toBeGreaterThanOrEqual(3)
        }
      })

      // Birincil eylem `bg-cta text-on-brand`: degradenin HER durağı ölçülür,
      // ortalama değil. Açık ucu geçmeyen degrade CTA olamaz (bg-brand bu yüzden karo).
      it(`${name}/${theme}: on-brand / cta-gradient her durak ≥ ${AA}`, () => {
        const onBrand = parseColor(cssVar(cssBlock(':root'), '--on-brand') ?? '').rgb
        const stops = gradientStops(p.ctaGradient)
        expect(stops.length).toBeGreaterThanOrEqual(2)
        for (const stop of stops) expect(contrast(onBrand, stop)).toBeGreaterThanOrEqual(AA)
      })
    }
  }

  // Durum renkleri sistem katmanında: palet değişse de aynı. Rozet 12 px
  // metni kendi wash'ı üstünde yazar, çoğu zaman bir kartın içinde.
  for (const theme of ['light', 'dark'] as const) {
    const r = roles[theme]
    const card = over(r.surface, r.pageBg)
    for (const status of ['success', 'warning', 'danger'] as const) {
      const wash = r[`${status}Wash`]
      it(`sistem/${theme}: ${status} / page-bg, (wash ∘ page-bg), (wash ∘ kart) ≥ ${AA}`, () => {
        const ink = parseColor(r[status]).rgb
        expect(contrast(ink, parseColor(r.pageBg).rgb), 'page').toBeGreaterThanOrEqual(AA)
        expect(contrast(ink, over(wash, r.pageBg)), 'wash').toBeGreaterThanOrEqual(AA)
        expect(contrast(ink, over(wash, card)), 'kart').toBeGreaterThanOrEqual(AA)
      })
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`sistem/${theme}: text-muted / page-bg ≥ ${AA}`, () => {
      const r = roles[theme]
      expect(contrast(parseColor(r.textMuted).rgb, parseColor(r.pageBg).rgb)).toBeGreaterThanOrEqual(AA)
    })
  }
})
