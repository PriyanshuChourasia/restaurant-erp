import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useCategories,
  useActivateCategory,
  useDeactivateCategory,
} from '../hooks/useCategoryQueries'
import { CategoryToolbar } from '../components/CategoryToolbar'
import { CategoryTable } from '../components/CategoryTable'
import { DeleteCategoryDialog } from '../dialogs/DeleteCategoryDialog'
import { RestoreCategoryDialog } from '../dialogs/RestoreCategoryDialog'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import { useDeleteCategory, useRestoreCategory } from '../hooks/useCategoryQueries'
import type { CategoryResponse, CategoryListParams } from '../types/category.types'

export function CategoryListPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<CategoryListParams>({
    page: 1,
    limit: 20,
    sortBy: 'displayOrder',
    sortOrder: 'ASC',
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useCategories(params)
  const deleteMutation = useDeleteCategory()
  const restoreMutation = useRestoreCategory()
  const activateMutation = useActivateCategory()
  const deactivateMutation = useDeactivateCategory()

  const handleSearchChange = useCallback(
    (searchValue: string) => {
      setSearch(searchValue)
      setParams((prev) => ({ ...prev, search: searchValue || undefined, page: 1 }))
    },
    [],
  )

  const handleFilterChange = useCallback(
    (filters: Partial<CategoryListParams>) => {
      setParams((prev) => ({ ...prev, ...filters, page: 1 }))
    },
    [],
  )

  const handleSort = useCallback(
    (key: string) => {
      setParams((prev) => ({
        ...prev,
        sortBy: key,
        sortOrder:
          prev.sortBy === key && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      }))
    },
    [],
  )

  const handleCreate = useCallback(() => {
    navigate({ to: '/categories/create' })
  }, [navigate])

  const handleEdit = useCallback(
    (category: CategoryResponse) => {
      navigate({ to: `/categories/${category.id}/edit` })
    },
    [navigate],
  )

  const handleView = useCallback(
    (category: CategoryResponse) => {
      navigate({ to: `/categories/${category.id}` })
    },
    [navigate],
  )

  const handleDelete = useCallback((category: CategoryResponse) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }, [])

  const handleRestore = useCallback((category: CategoryResponse) => {
    setSelectedCategory(category)
    setRestoreDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(
    async (force: boolean) => {
      if (!selectedCategory) return
      await deleteMutation.mutateAsync({
        id: selectedCategory.id,
        force,
      })
      refetch()
    },
    [selectedCategory, deleteMutation, refetch],
  )

  const handleRestoreConfirm = useCallback(async () => {
    if (!selectedCategory) return
    await restoreMutation.mutateAsync(selectedCategory.id)
    refetch()
  }, [selectedCategory, restoreMutation, refetch])

  const handleActivate = useCallback(
    async (category: CategoryResponse) => {
      await activateMutation.mutateAsync(category.id)
      refetch()
    },
    [activateMutation, refetch],
  )

  const handleDeactivate = useCallback(
    async (category: CategoryResponse) => {
      await deactivateMutation.mutateAsync(category.id)
      refetch()
    },
    [deactivateMutation, refetch],
  )

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Failed to load categories</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your content with a hierarchical category structure.
        </p>
      </div>

      {/* Toolbar */}
      <CategoryToolbar
        search={search}
        onSearchChange={handleSearchChange}
        filters={{
          isActive: params.isActive,
          includeDeleted: params.includeDeleted,
        }}
        onFilterChange={handleFilterChange}
        onRefresh={() => refetch()}
        onCreate={handleCreate}
      />

      {/* Table */}
      {isLoading ? (
        <LoadingState rows={8} columns={7} />
      ) : data && data.items.length > 0 ? (
        <>
          <CategoryTable
            categories={data.items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onView={handleView}
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSort={handleSort}
          />

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.page - 1) * data.limit + 1}-
                {Math.min(data.page * data.limit, data.total)} of {data.total} categories
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setParams((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
                  }
                  disabled={(params.page || 1) <= 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
                >
                  Previous
                </button>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === data.totalPages ||
                      Math.abs(p - (data.page || 1)) <= 2,
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">...</span>
                      )}
                      <button
                        onClick={() => setParams((prev) => ({ ...prev, page: p }))}
                        className={`rounded px-3 py-1 text-sm ${
                          (data.page || 1) === p
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border hover:bg-muted'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() =>
                    setParams((prev) => ({ ...prev, page: Math.min(data.totalPages, (prev.page || 1) + 1) }))
                  }
                  disabled={(params.page || 1) >= data.totalPages}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No categories found"
          description={
            params.search
              ? `No categories match "${params.search}".`
              : 'Get started by creating your first category.'
          }
          actionLabel="Create Category"
          onAction={params.search ? () => handleSearchChange('') : handleCreate}
        />
      )}

      {/* Dialogs */}
      <DeleteCategoryDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        categoryName={selectedCategory?.name || ''}
        hasChildren={(selectedCategory?.childrenCount || 0) > 0}
      />
      <RestoreCategoryDialog
        isOpen={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        onConfirm={handleRestoreConfirm}
        categoryName={selectedCategory?.name || ''}
      />
    </div>
  )
}
