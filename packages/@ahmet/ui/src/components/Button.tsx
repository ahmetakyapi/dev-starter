'use client'

import { cn } from '../utils'
import { motion } from 'framer-motion'
import { useMagnetic } from '../hooks/useMagnetic'

type Variant = 'primary' | 'ghost' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  magnetic?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-ahmet-indigo text-white shadow-lg shadow-ahmet-indigo/20 hover:brightness-110 hover:shadow-ahmet-indigo/40',
  ghost:   'glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
  outline: 'border border-slate-300/60 dark:border-slate-600/60 text-slate-600 dark:text-slate-300 hover:border-ahmet-indigo/60 hover:text-ahmet-indigo dark:hover:text-indigo-300',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const { mx, my, onMove, onLeave } = useMagnetic(0.26)

  if (magnetic) {
    return (
      <motion.button
        style={{ x: mx, y: my }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'rounded-xl font-semibold transition-all active:scale-95',
          variants[variant],
          sizes[size],
          className,
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <button
      className={cn(
        'rounded-xl font-semibold transition-all active:scale-95',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
