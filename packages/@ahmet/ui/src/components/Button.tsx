'use client'

import { m } from 'motion/react'
import { cn } from '../utils'
import { useMagnetic } from '../hooks/useMagnetic'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
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

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,color,border-color,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus'

export function Button({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const { mx, my, onMove, onLeave } = useMagnetic(0.26)
  const classes = cn(base, variants[variant], sizes[size], className)

  if (magnetic) {
    return (
      <m.button
        type={type}
        style={{ x: mx, y: my }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileTap={{ scale: 0.96 }}
        className={classes}
        {...(props as React.ComponentPropsWithoutRef<typeof m.button>)}
      >
        {children}
      </m.button>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
