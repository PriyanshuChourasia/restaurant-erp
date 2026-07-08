import { useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (force: boolean) => Promise<void>
  categoryName: string
  hasChildren?: boolean
}

export function DeleteCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  hasChildren = false,
}: DeleteCategoryDialogProps) {
  const [forceDelete, setForceDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(forceDelete)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={20} className="text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Delete Category</h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-foreground">
          Are you sure you want to delete <strong>"{categoryName}"</strong>?
        </p>

        {hasChildren && (
          <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-warning">Category has children</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This category has sub-categories. Enable force delete to remove all descendants.
                </p>
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="h-4 w-4 accent-destructive"
              />
              <span className="text-sm text-foreground">Force delete all descendants</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
