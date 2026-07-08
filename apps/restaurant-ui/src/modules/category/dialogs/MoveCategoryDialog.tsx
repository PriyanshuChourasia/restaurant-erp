import { useState, useEffect } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { ParentCategorySelector } from '../components/ParentCategorySelector'
import type { TreeCategory } from '../types/category.types'

interface MoveCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (parentId: string | null) => Promise<void>
  categoryId: string
  categoryName: string
  currentParentId: string | null
  initialParentId?: string | null
  tree: TreeCategory[]
}

export function MoveCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
  categoryId,
  categoryName,
  currentParentId,
  initialParentId,
  tree,
}: MoveCategoryDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    initialParentId !== undefined ? initialParentId : currentParentId,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedParentId(
        initialParentId !== undefined ? initialParentId : currentParentId,
      )
      setError(null)
    }
  }, [isOpen, currentParentId, initialParentId])

  if (!isOpen) return null

  const isChanged = selectedParentId !== currentParentId

  const handleConfirm = async () => {
    if (!isChanged) return
    setIsLoading(true)
    setError(null)
    try {
      await onConfirm(selectedParentId ?? null)
      onClose()
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : err instanceof Error
          ? err.message
          : undefined
      setError(message || 'Failed to move category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ArrowRight size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Move Category</h3>
            <p className="text-sm text-muted-foreground">
              Select a new parent for "{categoryName}".
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">CURRENT LOCATION</p>
          <p className="mt-0.5 text-sm text-foreground">
            {currentParentId ? 'Sub-category' : 'Root category'}
          </p>
        </div>

        <div className="mb-4">
          <ParentCategorySelector
            tree={tree}
            value={selectedParentId}
            onChange={setSelectedParentId}
            excludeId={categoryId}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isChanged || isLoading}>
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowRight size={14} />
            )}
            {isLoading ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </div>
    </div>
  )
}
