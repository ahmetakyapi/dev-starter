import { defineConfig } from 'tsup'

/**
 * tsup, bundle ederken kaynak dosyalardaki `'use client'` direktifini DÜŞÜRÜR.
 * Direktifsiz dist, Next.js App Router'da bir Server Component'ten import edilince
 * "You're importing a component that needs useState" hatasıyla kırılır —
 * yayındaki 2.1.0 bu yüzden App Router'da kullanılamıyordu (mistakes.md #52).
 *
 * Bileşenler için tek bundle + banner en doğru ve en ucuz çözüm: Chip gibi
 * hook'suz bileşenler de aynı bundle'da olduğundan direktifi zaten paylaşıyorlar.
 * Ama saf DEĞERLER (cn, EASE, DUR, varyantlar) banner'lı bundle'dan sunucuya
 * istemci referansı olarak gelir (mistakes.md #84). Onlar için ikinci giriş
 * `core`: banner'sız, `@ahmetakyapi/ui/core`. Ana giriş geriye dönük uyum
 * için aynı değerleri dışa aktarmayı sürdürür (istemci bileşeninde sorun yok).
 * preserve-directives plugin'i bu boyutta gereksiz.
 *
 * Regresyon koruması: scripts/verify-package-exports.mjs ana girişin İLK
 * satırında direktifi arar, `core` girişinde ise direktif OLMADIĞINI doğrular.
 */
export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    banner: { js: "'use client'" },
  },
  {
    entry: { core: 'src/core.ts' },
    format: ['esm', 'cjs'],
    dts: true,
  },
])
