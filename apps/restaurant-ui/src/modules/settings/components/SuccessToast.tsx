import { CheckCircle2 } from 'lucide-react'

interface SuccessToastProps {
  message: string
}

/**
 * Renders a green success toast banner.
 *
 * Single Responsibility: ONLY renders a success notification.
 */
export function SuccessToast({ message }: SuccessToastProps) {
  return (
    <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-fade-in">
      <CheckCircle2 size={16} />
      {message}
    </div>
  )
}
