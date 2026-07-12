import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeader } from './SectionHeader'

interface SettingsSectionProps {
  icon: LucideIcon
  title: string
  children: ReactNode
}

/**
 * Reusable card wrapper for a settings section.
 *
 * SOLID:
 * - Single Responsibility: ONLY renders the card shell + header + body.
 * - Open/Closed: Open to extension via `children`, closed to modification.
 */
export function SettingsSection({ icon, title, children }: SettingsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <SectionHeader icon={icon} title={title} />
      <div className="p-5">{children}</div>
    </div>
  )
}
