import type { LucideIcon } from 'lucide-react'

export interface ReportKpiConfig {
  label: string
  dataKey: string
  format?: 'currency' | 'number' | 'percent' | 'decimal'
  color?: string
  icon?: LucideIcon
  subtitle?: string
}

export interface ReportColumn {
  header: string
  accessorKey: string
  align?: 'left' | 'right' | 'center'
  format?: 'currency' | 'number' | 'percent' | 'decimal' | 'date'
}

export interface ReportConfig {
  id: string
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  category: string
  categoryLabel: string
  defaultPreset?: string
  endpoint: string
  kpis: ReportKpiConfig[]
  columns?: ReportColumn[]
  searchable?: boolean
  searchFields?: string[]
  noTable?: boolean
}
