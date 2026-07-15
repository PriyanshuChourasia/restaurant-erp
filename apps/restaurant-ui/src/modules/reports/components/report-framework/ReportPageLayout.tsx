import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useDateRange, DateRangeFilter } from '../DateRangeFilter'

interface ReportPageLayoutProps {
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  badge?: { label: string; color: string }
  defaultPreset?: string
  extraFilters?: ReactNode
  children: (fromDate: string, toDate: string) => ReactNode
}

export function ReportPageLayout({ title, description, icon: Icon, iconBg, badge, defaultPreset = 'month', extraFilters, children }: ReportPageLayoutProps) {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange(defaultPreset as any)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm`}>
            <Icon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
              {badge && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {extraFilters}
          <DateRangeFilter
            value={{ fromDate, toDate }}
            onChange={setCustom}
            activePreset={preset}
            onPresetChange={setPreset}
          />
        </div>
      </div>

      {children(fromDate, toDate)}
    </div>
  )
}
