import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit,
  Trash2,
  Undo2,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { ActivateToggle } from './ActivateToggle'
import type { CategoryResponse } from '../types/category.types'
import { formatDate } from '../utils/category.utils'

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface CategoryTableProps {
  categories: CategoryResponse[]
  onEdit: (category: CategoryResponse) => void
  onDelete: (category: CategoryResponse) => void
  onRestore: (category: CategoryResponse) => void
  onActivate: (category: CategoryResponse) => Promise<void>
  onDeactivate: (category: CategoryResponse) => Promise<void>
  onView: (category: CategoryResponse) => void
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  onSort?: (key: string) => void
  isLoading?: boolean
}

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'parentId', label: 'Parent' },
  { key: 'isActive', label: 'Status', sortable: true },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions' },
]

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy?: string; sortOrder?: string }) {
  if (sortBy !== column) return <ChevronsUpDown size={12} className="text-muted-foreground/50" />
  return sortOrder === 'ASC' ? (
    <ChevronUp size={12} className="text-primary" />
  ) : (
    <ChevronDown size={12} className="text-primary" />
  )
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  onRestore,
  onActivate,
  onDeactivate,
  onView,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
}: CategoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                  col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                }`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIcon column={col.key} sortBy={sortBy} sortOrder={sortOrder} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {categories.map((category) => (
            <tr
              key={category.id}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(category)}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {category.name}
                  </button>
                  {category.deletedAt && (
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                      Deleted
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                {category.slug}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {category.parentId ? (
                  <span className="text-foreground">Sub-category</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {category.deletedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive border border-destructive/20">
                    Deleted
                  </span>
                ) : (
                  <StatusBadge isActive={category.isActive} />
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {category.displayOrder}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(category.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onView(category)}
                    title="View details"
                  >
                    <Eye size={14} />
                  </Button>
                  {category.deletedAt ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRestore(category)}
                      title="Restore"
                    >
                      <Undo2 size={14} />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onEdit(category)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Button>
                      <ActivateToggle
                        isActive={category.isActive}
                        onActivate={() => onActivate(category)}
                        onDeactivate={() => onDeactivate(category)}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(category)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && !isLoading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
