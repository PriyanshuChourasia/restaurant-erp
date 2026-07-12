import { Loader2 } from 'lucide-react'

/**
 * Full-page loading spinner.
 *
 * Single Responsibility: ONLY renders a centered loading spinner.
 */
export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  )
}
