import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
}

/**
 * Renders a section card header with icon + title.
 * Single Responsibility: ONLY renders the header bar of a settings section.
 */
export function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
      <Icon size={16} className="text-primary" />
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
  )
}
