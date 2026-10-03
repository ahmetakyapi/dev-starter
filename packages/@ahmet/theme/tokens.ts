/**
 * @ahmetakyapi/theme — Design Tokens (JS tarafı)
 *
 * Kaynak: ahmetakyapi.com (referans görsel dil)
 *
 * v3'ten itibaren stilin tek kaynağı `theme.css` (Tailwind v4; sistem +
 * palet + köprü). Bu dosya CSS'in okunamadığı yerler için duruyor: OG
 * görseli (Satori CSS değişkeni çözmez), Motion eğrisi, e-posta şablonu.
 * `roles` (sistem katmanı) ve `palettes` (palet katmanı) theme.css'teki ham
 * değerlerin aynısıdır; tests/contract.test.ts ikisinin ayrışmadığını ve
 * her paletin WCAG kontrastını doğrular.
 *
 * v2 alanları (`colors.bg/accent/text/border/glass`, `gradients.signature`,
 * `gradients.page*`) indigo/cyan/emerald dönemine ait ve @deprecated: yeni
 * kod `roles`, `palettes`, `colors.brand` ve `gradients.brand` okur.
 */

export const colors = {
  /**
   * Varsayılan marka (signature paleti, Açılış Zili mavi ailesi).
   * Kısayol: `palettes.signature` + sistem zemini. Satori/e-posta için.
   */
  brand: {
    light: { bg: '#f7f9fb', primary: '#0d74c4', primaryInk: '#0c69b1', onPrimary: '#ffffff' },
    dark: { bg: '#070d16', primary: '#35b8ff', primaryInk: '#35b8ff', onPrimary: '#06121f' },
    displayGradient: {
      light: 'linear-gradient(112deg, #0a2140 0%, #0e4a8f 44%, #1272c9 76%, #2493dd 100%)',
      dark: 'linear-gradient(112deg, #f2f7fc 0%, #b6e2ff 44%, #74caff 76%, #3fbcff 100%)',
    },
  },
  /** @deprecated v2 zemini. v3: `roles.{light,dark}.pageBg` / `colors.brand.*.bg`. */
  bg: {
    dark: '#04070d',
    light: '#f5f7fb',
  },
  /** @deprecated v2 indigo/cyan/emerald vurguları. v3: `palettes.*`. */
  accent: {
    indigo: {
      DEFAULT: 'rgb(79, 70, 229)',
      soft: 'rgba(79, 70, 229, 0.14)',
      glow: 'rgba(99, 102, 241, 0.12)',
    },
    cyan: {
      DEFAULT: 'rgb(34, 211, 238)',
      soft: 'rgba(34, 211, 238, 0.09)',
      glow: 'rgba(56, 189, 248, 0.24)',
      scrollbar: 'rgba(56, 189, 248, 0.28)',
    },
    emerald: {
      DEFAULT: 'rgb(16, 185, 129)',
      soft: 'rgba(16, 185, 129, 0.05)',
    },
    blue: {
      DEFAULT: 'rgb(59, 130, 246)',
      soft: 'rgba(59, 130, 246, 0.12)',
    },
    sky: {
      soft: 'rgba(14, 165, 233, 0.1)',
      shadowSm: 'rgba(125, 211, 252, 0.2)',
      shadowMd: 'rgba(125, 211, 252, 0.4)',
    },
  },
  // Metin
  /** @deprecated v2 değeri. v3: `roles`. */
  text: {
    dark: '#e2e8f0',
    light: '#0f172a',
    mutedDark: 'rgba(148, 163, 184, 0.7)',
    mutedLight: '#334155',
  },
  // Kenarlık
  /** @deprecated v2 değeri. v3: `roles`. */
  border: {
    dark: 'rgba(148, 163, 184, 0.1)',
    light: 'rgba(148, 163, 184, 0.2)',
    focus: 'rgba(99, 102, 241, 0.5)',
  },
  // Glass overlay renkleri
  /** @deprecated v2 değeri. v3: `roles`. */
  glass: {
    dark: 'rgba(8, 12, 22, 0.72)',
    darkAlt: 'rgba(6, 10, 18, 0.46)',
    light: 'rgba(255, 255, 255, 0.84)',
    lightAlt: 'rgba(255, 255, 255, 0.72)',
    chip: 'rgba(7, 11, 20, 0.56)',
    insetHighlight: 'rgba(255, 255, 255, 0.04)',
  },
} as const

export const fonts = {
  sans: 'Manrope',
  mono: 'IBM Plex Mono',
  fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  /** next/font'un yazdığı CSS değişkenleri — theme.css bunları okur. */
  cssVar: { sans: '--font-sans-face', mono: '--font-mono-face' },
  /**
   * @deprecated Google Fonts CSS @import'u render'ı bloklar ve CLS üretir;
   * fontu next/font ile yükle (`cssVar` adlarıyla). Yalnızca geriye dönük uyum.
   */
  googleUrl:
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap&subset=latin-ext',
} as const

export const spacing = {
  container: {
    maxWidth: '80rem',   // max-w-7xl
    px: '1.5rem',        // px-6
  },
  section: {
    py: '5rem',          // py-20
  },
} as const

export const radii = {
  card: '1rem',          // rounded-2xl
  pill: '999px',         // rounded-full
  logo: '1rem',          // rounded-2xl
} as const

export const shadows = {
  card: '0 14px 34px rgba(2, 6, 23, 0.14)',
  cardLight: '0 16px 44px rgba(148, 163, 184, 0.14)',
  logo: '0 0 0 1px rgba(125, 211, 252, 0.2)',
  logoHover: '0 0 0 1px rgba(125, 211, 252, 0.4)',
  glow: {
    indigo: '0 0 0 1px rgba(99, 102, 241, 0.3), 0 4px 20px rgba(99, 102, 241, 0.2)',
    cyan: '0 0 0 1px rgba(34, 211, 238, 0.3), 0 4px 20px rgba(34, 211, 238, 0.15)',
  },
} as const

export const animation = {
  // Framer Motion ease curve — yumuşak, hızlı başlayıp yavaşlayan
  ease: [0.22, 1, 0.36, 1] as const,
  // Spring presets
  spring: {
    snappy: { stiffness: 300, damping: 30 },
    bouncy: { stiffness: 160, damping: 18 },
    smooth: { stiffness: 140, damping: 16 },
    magnetic: { stiffness: 160, damping: 18 },
  },
  // Stagger
  stagger: {
    fast: 0.07,
    normal: 0.12,
    slow: 0.2,
  },
  // Duration
  duration: {
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
    theme: 0.25,
  },
} as const

export const gradients = {
  /**
   * Marka degradesi (signature paleti) — birincil eylem ve marka karosu.
   * İki temada aynı: sekme ve ana ekran ikonu temayı bilemez.
   * CSS karşılığı `--brand-gradient` / `bg-brand`.
   */
  brand: 'linear-gradient(150deg, #5cc4ff 0%, #1f86e0 48%, #0b3f86 100%)',
  /** @deprecated v2 indigo köşe ışığı. v3: `.app-bg` (`--app-glow`). */
  pageDark:
    'radial-gradient(circle at 18% 12%, rgba(79, 70, 229, 0.14), transparent 30%), radial-gradient(circle at 82% 10%, rgba(34, 211, 238, 0.09), transparent 24%), radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.05), transparent 28%)',
  /** @deprecated v2 köşe ışığı. v3: `.app-bg` (`--app-glow`). */
  pageLight:
    'radial-gradient(circle at 14% 12%, rgba(59, 130, 246, 0.12), transparent 30%), radial-gradient(circle at 82% 8%, rgba(14, 165, 233, 0.1), transparent 24%), radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.06), transparent 28%)',
  /**
   * @deprecated v2 indigo→blue→cyan imza degradesi. v3: `gradients.brand`
   * (CSS `bg-signature` sınıfı artık seçili paletin marka degradesine bağlı).
   *
   * İmza degradesi — ekosistemin TEK marka degradesi.
   *
   * Yalnızca üç yerde kullanılır (bkz. `rules/design-tokens.md → Degrade Disiplini`):
   *   1. Birincil eylem (primary CTA)
   *   2. Marka döşemesi (logo tile)
   *   3. Seçili gezinme satırı
   *
   * Violet/purple bu paletin parçası DEĞİLDİR — indigo→violet en tanınır
   * AI-slop tell'i (impeccable `ai-color-palette`). Marka rotası: indigo→blue→cyan.
   */
  signature: 'linear-gradient(135deg, rgb(99,102,241), rgb(59,130,246), rgb(34,211,238))',
  /** @deprecated `brand` kullan — v2 alias'ı, geriye dönük uyumluluk için duruyor. */
  logo: 'linear-gradient(to bottom right, rgb(99,102,241), rgb(59,130,246), rgb(34,211,238))',
  /** @deprecated v2 ızgara dokusu */
  gridDark:
    'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
  gridLight:
    'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
} as const

/**
 * Sistem katmanı — theme.css bölüm 1'in JS aynası (gölgeler hariç).
 * CSS'te `bg-page`, `text-strong` olarak kullanılır; buradaki değerler
 * yalnızca CSS değişkeni çözülemeyen yüzeyler (OG görseli) içindir.
 */
export const roles = {
  light: {
    pageBg: '#f7f9fb',
    surface: 'rgb(16 32 52 / 0.028)',
    surfaceRaised: 'rgb(16 32 52 / 0.07)',
    surfaceSunken: 'rgb(16 32 52 / 0.045)',
    overlay: '#ffffff',
    scrim: 'rgb(16 28 43 / 0.42)',
    textStrong: '#101c2b',
    textBody: '#54677c',
    textSoft: '#54677c',
    textMuted: '#586a7c',
    line: 'rgb(16 32 52 / 0.1)',
    lineSoft: 'rgb(16 32 52 / 0.06)',
    lineStrong: 'rgb(16 32 52 / 0.17)',
    success: '#0c7350',
    successWash: 'rgb(12 115 80 / 0.1)',
    warning: '#a4720f',
    warningWash: 'rgb(164 114 15 / 0.12)',
    danger: '#c01a3d',
    dangerWash: 'rgb(192 26 61 / 0.08)',
    accentWarm: '#a4720f',
  },
  dark: {
    pageBg: '#070d16',
    surface: 'rgb(255 255 255 / 0.05)',
    surfaceRaised: 'rgb(255 255 255 / 0.12)',
    surfaceSunken: 'rgb(0 0 0 / 0.3)',
    overlay: '#0e1724',
    scrim: 'rgb(2 6 12 / 0.66)',
    textStrong: '#eaf1f8',
    textBody: '#94a7ba',
    textSoft: '#94a7ba',
    textMuted: '#8497a9',
    line: 'rgb(255 255 255 / 0.11)',
    lineSoft: 'rgb(255 255 255 / 0.07)',
    lineStrong: 'rgb(255 255 255 / 0.2)',
    success: '#3ddc97',
    successWash: 'rgb(61 220 151 / 0.12)',
    warning: '#d3a04a',
    warningWash: 'rgb(211 160 74 / 0.14)',
    danger: '#ff5c7a',
    dangerWash: 'rgb(255 92 122 / 0.12)',
    accentWarm: '#d3a04a',
  },
} as const

/**
 * Palet katmanı — theme.css bölüm 2'nin JS aynası (`--palette-*`).
 * `signature` varsayılan; `<html data-palette="...">` ile seçilir.
 */
export const palettes = {
  signature: {
    light: {
      primary: '#0d74c4',
      primaryHover: '#0a5a9a',
      primarySoft: '#3a93d6',
      primaryWash: 'rgb(13 116 196 / 0.1)',
      primaryInk: '#0c69b1',
      onPrimary: '#ffffff',
      appGlow: 'rgb(13 116 196 / 0.06)',
      displayGradient: 'linear-gradient(112deg, #0a2140 0%, #0e4a8f 44%, #1272c9 76%, #2493dd 100%)',
      displayGradientTight: 'linear-gradient(100deg, #0a2547 0%, #1e6fbe 100%)',
      brandGradient: 'linear-gradient(150deg, #5cc4ff 0%, #1f86e0 48%, #0b3f86 100%)',
    },
    dark: {
      primary: '#35b8ff',
      primaryHover: '#7fd2ff',
      primarySoft: '#6bc9ff',
      primaryWash: 'rgb(53 184 255 / 0.14)',
      primaryInk: '#35b8ff',
      onPrimary: '#06121f',
      appGlow: 'rgb(53 184 255 / 0.12)',
      displayGradient: 'linear-gradient(112deg, #f2f7fc 0%, #b6e2ff 44%, #74caff 76%, #3fbcff 100%)',
      displayGradientTight: 'linear-gradient(100deg, #eef5fc 0%, #58c4ff 100%)',
      brandGradient: 'linear-gradient(150deg, #5cc4ff 0%, #1f86e0 48%, #0b3f86 100%)',
    },
  },
  verdant: {
    light: {
      primary: '#0f7a5a',
      primaryHover: '#0b5f46',
      primarySoft: '#3a9b7c',
      primaryWash: 'rgb(15 122 90 / 0.1)',
      primaryInk: '#0d6e51',
      onPrimary: '#ffffff',
      appGlow: 'rgb(15 122 90 / 0.06)',
      displayGradient: 'linear-gradient(112deg, #062a1f 0%, #0b5a42 44%, #0f7a5a 76%, #1f9a74 100%)',
      displayGradientTight: 'linear-gradient(100deg, #06301f 0%, #137a5c 100%)',
      brandGradient: 'linear-gradient(150deg, #6ee7b7 0%, #14a37a 48%, #08523c 100%)',
    },
    dark: {
      primary: '#34d399',
      primaryHover: '#6ee7b7',
      primarySoft: '#4fdcaa',
      primaryWash: 'rgb(52 211 153 / 0.14)',
      primaryInk: '#34d399',
      onPrimary: '#04140e',
      appGlow: 'rgb(52 211 153 / 0.12)',
      displayGradient: 'linear-gradient(112deg, #f0faf6 0%, #b4f0d8 44%, #6ee0b4 76%, #34d399 100%)',
      displayGradientTight: 'linear-gradient(100deg, #eefaf5 0%, #4fdcaa 100%)',
      brandGradient: 'linear-gradient(150deg, #6ee7b7 0%, #14a37a 48%, #08523c 100%)',
    },
  },
  ember: {
    light: {
      primary: '#b45309',
      primaryHover: '#8f4207',
      primarySoft: '#d97706',
      primaryWash: 'rgb(180 83 9 / 0.1)',
      primaryInk: '#a14a08',
      onPrimary: '#ffffff',
      appGlow: 'rgb(180 83 9 / 0.06)',
      displayGradient: 'linear-gradient(112deg, #3b1a04 0%, #7a3606 44%, #b45309 76%, #d97706 100%)',
      displayGradientTight: 'linear-gradient(100deg, #431d05 0%, #a14a08 100%)',
      brandGradient: 'linear-gradient(150deg, #fcd34d 0%, #e07a0c 48%, #7a3306 100%)',
    },
    dark: {
      primary: '#fbbf24',
      primaryHover: '#fcd34d',
      primarySoft: '#fcd062',
      primaryWash: 'rgb(251 191 36 / 0.14)',
      primaryInk: '#fbbf24',
      onPrimary: '#1a1002',
      appGlow: 'rgb(251 191 36 / 0.12)',
      displayGradient: 'linear-gradient(112deg, #fdf8ee 0%, #fde3a7 44%, #fcd062 76%, #fbbf24 100%)',
      displayGradientTight: 'linear-gradient(100deg, #fdf6e8 0%, #fbbf24 100%)',
      brandGradient: 'linear-gradient(150deg, #fcd34d 0%, #e07a0c 48%, #7a3306 100%)',
    },
  },
  iris: {
    light: {
      primary: '#5b4bd6',
      primaryHover: '#4636b8',
      primarySoft: '#7d70e0',
      primaryWash: 'rgb(91 75 214 / 0.1)',
      primaryInk: '#5243c8',
      onPrimary: '#ffffff',
      appGlow: 'rgb(91 75 214 / 0.06)',
      displayGradient: 'linear-gradient(112deg, #1b1550 0%, #3a2d9e 44%, #5b4bd6 76%, #7d70e0 100%)',
      displayGradientTight: 'linear-gradient(100deg, #1e1858 0%, #5243c8 100%)',
      brandGradient: 'linear-gradient(150deg, #c7d2fe 0%, #6d5fe0 48%, #2e2490 100%)',
    },
    dark: {
      primary: '#a5b4fc',
      primaryHover: '#c7d2fe',
      primarySoft: '#b4c0fd',
      primaryWash: 'rgb(165 180 252 / 0.14)',
      primaryInk: '#a5b4fc',
      onPrimary: '#0c0e24',
      appGlow: 'rgb(165 180 252 / 0.12)',
      displayGradient: 'linear-gradient(112deg, #f4f5fe 0%, #d9defe 44%, #bcc6fd 76%, #a5b4fc 100%)',
      displayGradientTight: 'linear-gradient(100deg, #f1f3fe 0%, #a5b4fc 100%)',
      brandGradient: 'linear-gradient(150deg, #c7d2fe 0%, #6d5fe0 48%, #2e2490 100%)',
    },
  },
} as const

export type PaletteName = keyof typeof palettes

/**
 * Motion sözleşmesi (v3). `animation` v2 değerlerini geriye dönük uyum için
 * taşır; yeni kod bunu okur. @ahmetakyapi/ui `DUR` / `SPRING` ile aynı sayılar.
 */
export const motion = {
  ease: [0.22, 1, 0.36, 1] as const,
  dur: { fast: 0.16, base: 0.28, slow: 0.5, page: 0.6 },
  spring: {
    snappy: { type: 'spring', stiffness: 500, damping: 40 },
    soft: { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 },
  },
  stagger: 0.06,
} as const

export const theme = {
  colors,
  fonts,
  spacing,
  radii,
  shadows,
  animation,
  motion,
  gradients,
  roles,
  palettes,
} as const

export default theme
