import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Edit, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useCategory,
  useCategoryBreadcrumb,
  useCategoryChildren,
  useDeleteCategory,
  useRestoreCategory,
} from '../hooks/useCategoryQueries'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryBreadcrumb } from '../components/CategoryBreadcrumb'
import { CardLoadingState } from '../components/LoadingState'
import { DeleteCategoryDialog } from '../dialogs/DeleteCategoryDialog'
import { RestoreCategoryDialog } from '../dialogs/RestoreCategoryDialog'
import { formatDateTime } from '../utils/category.utils'
import { useState } from 'react'

interface CategoryDetailsPageProps {
  categoryId: string
}

export function CategoryDetailsPage({ categoryId }: CategoryDetailsPageProps) {
  const navigate = useNavigate()
  const { data: category, isLoading: catLoading } = useCategory(categoryId)
  const { data: breadcrumb, isLoading: breadcrumbLoading } = useCategoryBreadcrumb(categoryId)
  const { data: children, isLoading: childrenLoading } = useCategoryChildren(categoryId)
  const deleteMutation = useDeleteCategory()
  const restoreMutation = useRestoreCategory()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  const isLoading = catLoading
  const isDeleted = !!category?.deletedAt

  const handleBreadcrumbNavigate = (id: string) => {
    if (id === 'root') {
      navigate({ to: '/categories' })
    } else {
      navigate({ to: `/categories/${id}` })
    }
  }

  if (isLoading) {
    return <CardLoadingState />
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Category not found</p>
        <Button variant="link" onClick={() => navigate({ to: '/categories' })} className="mt-2">
          Back to categories
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate({ to: '/categories' })}>
            <ChevronLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
              {isDeleted ? (
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive border border-destructive/20">
                  Deleted
                </span>
              ) : (
                <StatusBadge isActive={category.isActive} />
              )}
            </div>
            <CategoryBreadcrumb
              items={breadcrumb?.items || []}
              isLoading={breadcrumbLoading}
              onNavigate={handleBreadcrumbNavigate}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestoreDialogOpen(true)}
            >
              <Undo2 size={14} />
              Restore
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: `/categories/${category.id}/edit` })}
              >
                <Edit size={14} />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6">
              <InfoField label="Name" value={category.name} />
              <InfoField label="Slug" value={category.slug} mono />
              <InfoField label="Description" value={category.description || '—'} />
              <InfoField label="Display Order" value={String(category.displayOrder)} />
              <InfoField label="Parent" value={category.parentId ? 'Yes (sub-category)' : 'Root category'} />
              <InfoField label="Level" value={String(category.level)} />
              <InfoField label="Path" value={category.path || '—'} mono />
              <InfoField label="Children" value={String(category.childrenCount)} />
            </div>
          </div>

          {/* Children */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">
                Children ({children?.length || 0})
              </h3>
            </div>
            {childrenLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : children && children.length > 0 ? (
              <div className="divide-y divide-border">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate({ to: `/categories/${child.id}` })}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{child.name}</span>
                      <StatusBadge isActive={child.isActive} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {child.childrenCount > 0 ? `${child.childrenCount} sub-categories` : 'No children'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No child categories.</div>
            )}
          </div>
        </div>

        {/* Right column: Audit Info */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">Audit Information</h3>
            </div>
            <div className="space-y-4 p-6">
              <InfoField label="Created" value={formatDateTime(category.createdAt)} />
              <InfoField label="Updated" value={formatDateTime(category.updatedAt)} />
              <InfoField label="Created By" value={category.createdBy || 'System'} />
              <InfoField label="Updated By" value={category.updatedBy || '—'} />
              {category.deletedAt && (
                <>
                  <InfoField label="Deleted At" value={formatDateTime(category.deletedAt)} />
                  <InfoField label="Deleted By" value={category.deletedBy || '—'} />
                </>
              )}
              <InfoField label="Version" value={String(category.version)} />
              <InfoField label="ID" value={category.id} mono />
            </div>
          </div>
        </div>
      </div>

      <DeleteCategoryDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async (force) => {
          await deleteMutation.mutateAsync({ id: categoryId, force })
          navigate({ to: '/categories' })
        }}
        categoryName={category.name}
        hasChildren={(category.childrenCount || 0) > 0}
      />
      <RestoreCategoryDialog
        isOpen={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        onConfirm={async () => {
          await restoreMutation.mutateAsync(categoryId)
          navigate({ to: '/categories' })
        }}
        categoryName={category.name}
      />
    </div>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`mt-0.5 text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
