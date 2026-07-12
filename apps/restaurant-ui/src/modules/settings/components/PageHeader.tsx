import { Save, Loader2 } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle: string
  isSaving: boolean
  onSave: () => void
}

/**
 * Renders the page header with title, subtitle, and save button.
 *
 * Single Responsibility: ONLY renders the top header bar.
 * Dependency Inversion: Receives `onSave` callback — doesn't know about mutations.
 */
export function PageHeader({ title, subtitle, isSaving, onSave }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Save size={15} />
        )}
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
