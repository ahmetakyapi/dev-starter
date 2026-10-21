'use client'

import { m } from 'motion/react'
import { cn } from '../utils'
import { useMagnetic } from '../hooks/useMagnetic'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

// `ComponentProps<'button'>`: React 19'da `ref` sıradan prop, tipte de kabul edilir.
// Tip tam kalır: düz <button> yolu `onDragStart` gibi DOM işleyicilerini olduğu
// gibi geçirir; motion'la çakışanlar yalnızca mıknatıslı yolda ayıklanır.
export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  magnetic?: boolean
}

// Renk yalnızca token sınıfından: tema `data-theme` ile döner, koyu tema varyantı yazılmaz
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'border border-line bg-surface-raised text-strong hover:border-line-strong',
  ghost: 'text-soft hover:bg-surface-raised hover:text-strong',
  outline: 'border border-line-strong text-body hover:border-primary hover:text-primary-ink',
  danger: 'bg-danger-wash text-danger hover:bg-danger hover:text-on-primary',
}

// md ve lg 44 px dokunma hedefini karşılar; sm yoğun araç çubukları için
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-small',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-read',
}

// Basış `active:scale-*` ile: v4 bunu bağımsız `scale` özelliğine derler, geçiş
// listesinde `transform` değil `scale` olmalı. `transform` listede olursa
// mıknatıslı düğmede motion'ın her kare yazdığı transform'u CSS bir kez daha
// yumuşatır ve çekim imlecin gerisinde kalır.
const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,color,border-color,scale] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus'

// motion bu adları jest ve animasyon geri çağrısı olarak yeniden tanımlar,
// DOM imzasıyla m.button'a yayılamazlar: mıknatıslı yolda çağrılmazlar.
const MOTION_CONFLICTS = ['onAnimationStart', 'onDrag', 'onDragStart', 'onDragEnd'] as const

function withoutMotionConflicts<T extends object>(
  props: T,
): Omit<T, (typeof MOTION_CONFLICTS)[number]> {
  const copy = { ...props } as Record<string, unknown>
  for (const key of MOTION_CONFLICTS) delete copy[key]
  return copy as Omit<T, (typeof MOTION_CONFLICTS)[number]>
}

export function Button({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
  type = 'button',
  style,
  onMouseMove,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const { mx, my, onMove, onLeave } = useMagnetic(0.26)
  const classes = cn(base, variants[variant], sizes[size], className)

  if (magnetic) {
    const motionSafe = withoutMotionConflicts(props)
    // Tüketicinin stili ve fare işleyicileri mıknatısı ezmez, onunla birleşir:
    // prop birleştiren bir tetikleyici (tooltip, popover) `onMouseLeave`
    // verse de sıfırlama çalışır ve düğme imlecin son konumunda kalmaz.
    return (
      <m.button
        type={type}
        style={{ ...style, x: mx, y: my }}
        onMouseMove={(e: React.MouseEvent<HTMLButtonElement>) => {
          onMove(e)
          onMouseMove?.(e)
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          onLeave()
          onMouseLeave?.(e)
        }}
        className={classes}
        {...motionSafe}
      >
        {children}
      </m.button>
    )
  }

  return (
    <button
      type={type}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}
