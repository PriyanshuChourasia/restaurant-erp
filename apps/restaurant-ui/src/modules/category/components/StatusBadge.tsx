import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  isActive: boolean
  className?: string
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        isActive
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-muted text-muted-foreground border-border',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-success' : 'bg-muted-foreground',
        )}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
