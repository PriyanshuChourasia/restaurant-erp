import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryTree } from '../components/CategoryTree'
import { CategoryBreadcrumb } from '../components/CategoryBreadcrumb'
import { TreeLoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import {
  useCategoryTree,
  useCategoryBreadcrumb,
  useMoveCategory,
} from '../hooks/useCategoryQueries'
import { MoveCategoryDialog } from '../dialogs/MoveCategoryDialog'
import type { TreeCategory } from '../types/category.types'

export function CategoryTreePage() {
  const navigate = useNavigate()
  const { data: treeData, isLoading, isError, refetch } = useCategoryTree()
  const moveMutation = useMoveCategory()
  const [selectedNode, setSelectedNode] = useState<TreeCategory | null>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<{
    categoryId: string
    categoryName: string
    currentParentId: string | null
    initialParentId: string | null
  } | null>(null)

  const { data: breadcrumb, isLoading: breadcrumbLoading } = useCategoryBreadcrumb(
    selectedNode?.id || '',
  )

  const handleSelect = (node: TreeCategory) => {
    setSelectedNode(node)
  }

  const handleMove = (categoryId: string, targetParentId: string | null) => {
    // Find the category name
    const findName = (nodes: TreeCategory[], id: string): TreeCategory | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children.length > 0) {
          const found = findName(node.children, id)
          if (found) return found
        }
      }
      return null
    }

    const category = findName(treeData?.items || [], categoryId)
    if (category) {
      setMoveTarget({
        categoryId,
        categoryName: category.name,
        currentParentId: category.parentId,
        initialParentId: targetParentId,
      })
      setMoveDialogOpen(true)
    }
  }

  const handleMoveConfirm = async (parentId: string | null) => {
    if (!moveTarget) return
    await moveMutation.mutateAsync({
      id: moveTarget.categoryId,
      payload: { parentId },
    })
    refetch()
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Failed to load category tree</p>
        <Button variant="link" onClick={() => refetch()} className="mt-2">
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Category Tree</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize and manage your category hierarchy. Drag categories to reorganize.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Breadcrumb */}
      {selectedNode && (
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <CategoryBreadcrumb
            items={breadcrumb?.items || []}
            isLoading={breadcrumbLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tree */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <TreeLoadingState />
            </div>
          ) : treeData?.items && treeData.items.length > 0 ? (
            <CategoryTree
              tree={treeData.items}
              selectedId={selectedNode?.id}
              onSelect={handleSelect}
              onMove={handleMove}
            />
          ) : (
            <EmptyState
              title="No categories yet"
              description="Create categories to build your hierarchy."
              actionLabel="Create Category"
              onAction={() => navigate({ to: '/categories/create' })}
            />
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Selected</h3>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{selectedNode.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Slug</p>
                  <p className="mt-0.5 text-sm font-mono text-foreground">{selectedNode.slug}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Level</p>
                  <p className="mt-0.5 text-sm text-foreground">{selectedNode.level}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Children</p>
                  <p className="mt-0.5 text-sm text-foreground">{selectedNode.children.length}</p>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate({ to: `/categories/${selectedNode.id}` })}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate({ to: `/categories/${selectedNode.id}/edit` })}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Select a category from the tree to view details.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tips</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Click <strong>▶</strong> to expand/collapse nodes</li>
              <li>• Click a category to select it</li>
              <li>• Drag a category onto another to move it</li>
              <li>• Drag to the empty area to make it a root category</li>
            </ul>
          </div>
        </div>
      </div>

      <MoveCategoryDialog
        isOpen={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onConfirm={handleMoveConfirm}
        categoryId={moveTarget?.categoryId || ''}
        categoryName={moveTarget?.categoryName || ''}
        currentParentId={moveTarget?.currentParentId || null}
        initialParentId={moveTarget?.initialParentId}
        tree={treeData?.items || []}
      />
    </div>
  )
}
