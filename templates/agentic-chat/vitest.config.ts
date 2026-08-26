import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts?(x)'],
    // @copilotkit/react-core/v2 bir CSS dosyasi import eder. Node ESM bunu
    // cozemez ("Unknown file extension .css"). Paketi inline'a alinca Vite'in
    // transform hatti devreye girer ve CSS'i isler. -> mistakes.md #72
    server: { deps: { inline: ['@copilotkit/react-core'] } },
  },
})
