import { ChevronRight, Home } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { BreadcrumbItem } from '../types/category.types'

interface CategoryBreadcrumbProps {
  items: BreadcrumbItem[]
  isLoading?: boolean
  onNavigate?: (id: string) => void
}

export function CategoryBreadcrumb({
  items,
  isLoading,
  onNavigate,
}: CategoryBreadcrumbProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 py-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {onNavigate && (
        <>
          <button
            onClick={() => onNavigate('root')}
            className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
          >
            <Home size={14} />
            <span>Home</span>
          </button>
          <ChevronRight size={12} className="text-muted-foreground/50" />
        </>
      )}
      {items.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight size={12} className="text-muted-foreground/50" />
          )}
          {onNavigate && index < items.length - 1 ? (
            <button
              onClick={() => onNavigate(item.id)}
              className="rounded px-1 py-0.5 transition-colors hover:text-foreground"
            >
              {item.name}
            </button>
          ) : (
            <span
              className={
                index === items.length - 1
                  ? 'font-medium text-foreground'
                  : ''
              }
            >
              {item.name}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
