import { cn } from '../utils'

type ChipProps = {
  children: React.ReactNode
  className?: string
  /** Nokta rengi için token sınıfı, ör. `bg-success` */
  dot?: string
}

export function Chip({ children, className, dot }: ChipProps) {
  return (
    <span className={cn('chip', className)}>
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}
