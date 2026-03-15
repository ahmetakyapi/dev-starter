import type { Config } from 'tailwindcss'
import { colors, fonts, gradients } from './tokens'

/**
 * @ahmetakyapi/theme Tailwind Preset
 *
 * Kullanım:
 *   // tailwind.config.ts
 *   import preset from '@ahmetakyapi/theme/tailwind'
 *   export default { presets: [preset], content: [...] }
 */
const preset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [`var(--font-sans)`, fonts.fallback],
        mono: [`var(--font-mono)`, 'monospace'],
      },
      colors: {
        ahmet: {
          'bg-dark':  colors.bg.dark,
          'bg-light': colors.bg.light,
          indigo:     colors.accent.indigo.DEFAULT,
          cyan:       colors.accent.cyan.DEFAULT,
          emerald:    colors.accent.emerald.DEFAULT,
        },
      },
      backgroundImage: {
        'page-dark':  gradients.pageDark,
        'page-light': gradients.pageLight,
        'grid-dark':  gradients.gridDark,
        'grid-light': gradients.gridLight,
        'logo-gradient': gradients.logo,
      },
      backgroundSize: {
        grid: '64px 64px',
      },
      animation: {
        float:        'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 8s linear infinite',
        blink:        'blink 1.1s step-end infinite',
        'border-rotate': 'border-rotate 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-16px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        'border-rotate': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
}

export default preset
