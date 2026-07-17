import { Loader2, AlertTriangle, X } from 'lucide-react'
import { useDeleteDevUser } from '../hooks/useUserQueries'

interface UserDeleteDialogProps {
  open: boolean
  userId: string | null
  userName: string
  onClose: () => void
}

export function UserDeleteDialog({ open, userId, userName, onClose }: UserDeleteDialogProps) {
  const deleteMutation = useDeleteDevUser()

  if (!open || !userId) return null

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(userId)
      onClose()
    } catch {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Delete User</h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete <span className="font-medium text-gray-700">{userName}</span>?
              This action can be undone by restoring the user.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deleteMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
