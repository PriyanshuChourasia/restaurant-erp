import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  message: string
}

/**
 * Renders a centered error message.
 *
 * Single Responsibility: ONLY renders an error state.
 */
export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
    </div>
  )
}
