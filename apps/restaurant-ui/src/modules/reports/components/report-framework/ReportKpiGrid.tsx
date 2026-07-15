import { KpiCard, LoadingSkeleton } from '../ReportComponents'
import type { ReportKpiConfig } from '../../types/report-config.types'

function formatValue(value: number | string | undefined | null, format?: string): string {
  if (value === undefined || value === null) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return String(value)
  switch (format) {
    case 'currency':
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${num.toFixed(1)}%`
    case 'decimal':
      return num.toFixed(2)
    default:
      return num.toLocaleString('en-IN')
  }
}

interface ReportKpiGridProps {
  data: Record<string, any> | undefined | null
  configs: ReportKpiConfig[]
  isLoading: boolean
}

export function ReportKpiGrid({ data, configs, isLoading }: ReportKpiGridProps) {
  if (isLoading) return <LoadingSkeleton type="cards" rows={Math.min(configs.length, 4)} />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {configs.map((kpi) => (
        <KpiCard
          key={kpi.dataKey}
          label={kpi.label}
          value={formatValue(data?.[kpi.dataKey], kpi.format)}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          color={kpi.color}
        />
      ))}
    </div>
  )
}
