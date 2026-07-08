import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CategoryListParams } from '../types/category.types'

interface CategoryFiltersProps {
  filters: Pick<CategoryListParams, 'isActive' | 'includeDeleted'>
  onFilterChange: (filters: Partial<CategoryListParams>) => void
}

export function CategoryFilters({ filters, onFilterChange }: CategoryFiltersProps) {
  const activeFilters = [
    { label: 'Active', key: 'isActive' as const, value: true },
    { label: 'Inactive', key: 'isActive' as const, value: false },
    { label: 'Include Deleted', key: 'includeDeleted' as const, value: true },
  ]

  const hasActiveFilters =
    filters.isActive !== undefined || filters.includeDeleted === true

  const isActive = (key: string, value: boolean | undefined) => {
    return filters[key as keyof typeof filters] === value
  }

  return (
    <div className="flex items-center gap-2">
      <Filter size={14} className="text-muted-foreground" />
      {activeFilters.map((filter) => (
        <button
          key={`${filter.key}-${filter.value}`}
          onClick={() => {
            if (isActive(filter.key, filter.value)) {
              onFilterChange({ [filter.key]: undefined })
            } else {
              onFilterChange({ [filter.key]: filter.value })
            }
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
            isActive(filter.key, filter.value)
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/30',
          )}
        >
          {filter.label}
          {isActive(filter.key, filter.value) && <X size={10} />}
        </button>
      ))}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() =>
            onFilterChange({ isActive: undefined, includeDeleted: undefined })
          }
          className="text-muted-foreground"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
