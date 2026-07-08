import { useState } from 'react'
import { Loader2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestoreCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  categoryName: string
}

export function RestoreCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
}: RestoreCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <Undo2 size={20} className="text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Restore Category</h3>
            <p className="text-sm text-muted-foreground">
              This will restore the deleted category.
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-foreground">
          Are you sure you want to restore <strong>"{categoryName}"</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Undo2 size={14} />
            )}
            {isLoading ? 'Restoring...' : 'Restore'}
          </Button>
        </div>
      </div>
    </div>
  )
}
