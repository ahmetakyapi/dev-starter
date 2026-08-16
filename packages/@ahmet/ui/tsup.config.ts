import { defineConfig } from 'tsup'

/**
 * tsup, bundle ederken kaynak dosyalardaki `'use client'` direktifini DÜŞÜRÜR.
 * Direktifsiz dist, Next.js App Router'da bir Server Component'ten import edilince
 * "You're importing a component that needs useState" hatasıyla kırılır —
 * yayındaki 2.1.0 bu yüzden App Router'da kullanılamıyordu (mistakes.md #52).
 *
 * Paket tek bundle ürettiği için banner en doğru ve en ucuz çözüm: Chip gibi
 * hook'suz bileşenler de aynı bundle'da olduğundan direktifi zaten paylaşıyorlar.
 * Entry bölme / preserve-directives plugin'i bu boyutta gereksiz.
 *
 * Regresyon koruması: scripts/verify-package-exports.mjs her dist girişinin
 * İLK satırında direktifi arar.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  banner: { js: "'use client'" },
})
