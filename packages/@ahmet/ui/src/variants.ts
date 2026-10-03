/**
 * @ahmetakyapi/ui — Motion animasyon varyantları (`motion/react`)
 *
 * Tüm projelerde tutarlı geçişler için standart varyantlar.
 * Bu dosya `'use client'` DEĞİL ve hiçbir şey import etmez: sabitler
 * sunucu bileşeninden de gerçek değer olarak okunabilsin. `'use client'`
 * bir modülden dışa aktarılan değer sunucuya istemci referansı olarak gelir.
 */

// Temel ease curve — hızlı başlayıp yumuşak biten. CSS karşılığı `--ease-brand`.
export const EASE = [0.22, 1, 0.36, 1] as const

// Süre ölçeği (saniye). Mikro etkileşim `fast`, panel `base`, bölüm `slow`.
export const DUR = { fast: 0.16, base: 0.28, slow: 0.5, page: 0.6 } as const

export const SPRING = {
  snappy: { type: 'spring', stiffness: 500, damping: 40 },
  soft: { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 },
} as const

// Kardeşler arası gecikme — liste girişleri
export const STAGGER = 0.06

/** Kapsayıcı varyantı: çocukları `STAGGER` aralığıyla sırayla açar. */
export const stagger = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren: delay } },
})

// ─── Fade ──────────────────────────────────────────────────────────────────
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}

// ─── Fade + yukarı kayma ───────────────────────────────────────────────────
export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const fadeUpLarge = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

// ─── Fade + yana kayma ─────────────────────────────────────────────────────
export const fadeLeft = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
}

export const fadeRight = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
}

// ─── Scale ─────────────────────────────────────────────────────────────────
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
}

// ─── Stagger Container ─────────────────────────────────────────────────────
export const staggerContainer = (stagger = 0.12) => ({
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger },
  },
})

// ─── Slide Down (dropdown/modal) ───────────────────────────────────────────
export const slideDown = {
  hidden:  { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.2, ease: EASE } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
}

// ─── Modal / Command Palette ───────────────────────────────────────────────
export const modalBackdrop = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const modalPanel = {
  hidden:  { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.15 } },
}
