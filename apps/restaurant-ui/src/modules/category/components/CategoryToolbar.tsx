import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategorySearch } from './CategorySearch'
import { CategoryFilters } from './CategoryFilters'
import type { CategoryListParams } from '../types/category.types'

interface CategoryToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filters: Pick<CategoryListParams, 'isActive' | 'includeDeleted'>
  onFilterChange: (filters: Partial<CategoryListParams>) => void
  onRefresh: () => void
  onCreate: () => void
}

export function CategoryToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onRefresh,
  onCreate,
}: CategoryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <CategorySearch value={search} onChange={onSearchChange} />
        <CategoryFilters filters={filters} onFilterChange={onFilterChange} />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw size={14} />
          Refresh
        </Button>
        <Button size="sm" onClick={onCreate}>
          <Plus size={14} />
          Create Category
        </Button>
      </div>
    </div>
  )
}
