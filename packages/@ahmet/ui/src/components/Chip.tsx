import { cn } from '../utils'

interface ChipProps {
  children: React.ReactNode
  className?: string
  dot?: string
}

export function Chip({ children, className, dot }: ChipProps) {
  return (
    <span className={cn('chip', className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}
