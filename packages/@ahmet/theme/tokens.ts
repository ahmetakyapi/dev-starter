/**
 * @ahmetakyapi/theme — Design Tokens
 *
 * Kaynak: ahmetakyapi.com (referans görsel dil)
 * Her yeni projede bu tokenlar baz alınır, proje ihtiyacına göre override edilir.
 */

export const colors = {
  // Arka plan
  bg: {
    dark: '#04070d',
    light: '#f5f7fb',
  },
  // Vurgu renkleri (radial gradient'lerde kullanılır)
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
  text: {
    dark: '#e2e8f0',
    light: '#0f172a',
    mutedDark: 'rgba(148, 163, 184, 0.7)',
    mutedLight: '#334155',
  },
  // Kenarlık
  border: {
    dark: 'rgba(148, 163, 184, 0.1)',
    light: 'rgba(148, 163, 184, 0.2)',
    focus: 'rgba(99, 102, 241, 0.5)',
  },
  // Glass overlay renkleri
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
  // Sayfa arka planı — dark
  pageDark:
    'radial-gradient(circle at 18% 12%, rgba(79, 70, 229, 0.14), transparent 30%), radial-gradient(circle at 82% 10%, rgba(34, 211, 238, 0.09), transparent 24%), radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.05), transparent 28%)',
  // Sayfa arka planı — light
  pageLight:
    'radial-gradient(circle at 14% 12%, rgba(59, 130, 246, 0.12), transparent 30%), radial-gradient(circle at 82% 8%, rgba(14, 165, 233, 0.1), transparent 24%), radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.06), transparent 28%)',
  // Logo gradient
  logo: 'linear-gradient(to bottom right, rgb(99,102,241), rgb(59,130,246), rgb(34,211,238))',
  // Grid overlay (subtle)
  gridDark:
    'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
  gridLight:
    'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
} as const

export const theme = {
  colors,
  fonts,
  spacing,
  radii,
  shadows,
  animation,
  gradients,
} as const

export default theme
