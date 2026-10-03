/**
 * @ahmetakyapi/ui v3
 *
 * Bileşenler `motion.*` değil `m.*` kullanır: uygulama kökünde
 * `<LazyMotion features={domAnimation} strict>` olmalı (şablondaki
 * MotionProvider). `strict` altında `motion.*` hata fırlatır; `m.*` ise
 * LazyMotion OLMADAN animasyonsuz kalır. Renkler token sınıfından gelir,
 * bu yüzden @ahmetakyapi/theme/theme.css projeye import edilmiş olmalı.
 */

// Hooks
export { useSpotlight } from './hooks/useSpotlight'
export { useMagnetic } from './hooks/useMagnetic'
export { useCardTilt } from './hooks/useCardTilt'

// Animasyon sabitleri ve varyantları (motion/react)
export * from './variants'

// Utilities
export { cn } from './utils'

// Components
export { Surface, GlassCard } from './components/Surface'
export type { SurfaceProps, SurfaceVariant, GlassCardProps } from './components/Surface'
export { Chip } from './components/Chip'
export { Button } from './components/Button'
export { CustomCursor } from './components/CustomCursor'
