import { type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface ReportPageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  badge?: { label: string; color: string }
  children?: ReactNode
}

export function ReportPageHeader({ title, description, icon: Icon, iconColor = 'bg-gray-900', badge, children }: ReportPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColor} text-white shadow-sm`}>
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
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  color?: string
  trend?: { value: number; isPositive: boolean }
  className?: string
}

export function KpiCard({ label, value, subtitle, icon: Icon, color = 'gray', trend, className = '' }: KpiCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    gray: { bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
    red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
  }
  const c = colorMap[color] || colorMap.gray

  return (
    <div className={`rounded-xl border ${c.border} bg-white p-5 transition-all hover:shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
            <Icon size={18} className={`${c.text}`} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

interface ReportCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function ReportCard({ title, subtitle, action, children, className = '', noPadding = false }: ReportCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={noPadding ? '' : 'px-5 pb-5'}>{children}</div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: LucideIcon
}

const variantClasses: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function StatusBadge({ status, variant, icon: Icon }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {Icon && <Icon size={12} />}
      {status}
    </span>
  )
}

interface HorizontalBarProps {
  segments: Array<{ label: string; value: number; color: string; subLabel?: string }>
  height?: string
  showLabels?: boolean
}

export function HorizontalBarChart({ segments, height = 'h-8', showLabels = true }: HorizontalBarProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <p className="text-sm text-gray-400 italic">No data</p>

  return (
    <div>
      <div className={`${height} rounded-lg overflow-hidden flex bg-gray-50`}>
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={`${seg.label}-${i}`}
              className={`${seg.color} transition-all hover:opacity-80 relative group cursor-default`}
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {pct > 8 && <span className="text-[10px] font-medium text-white drop-shadow">{pct.toFixed(0)}%</span>}
              </div>
            </div>
          )
        })}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-3">
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0
            return (
              <div key={`${seg.label}-legend-${i}`} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
                <span className="text-xs text-gray-600">{seg.label}</span>
                <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  height?: string
  showLabel?: boolean
  label?: string
}

export function ProgressBar({ value, max, color = 'bg-blue-500', height = 'h-2', showLabel = false, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{label || ''}</span>
          {showLabel && <span className="font-medium text-gray-700">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`${height} bg-gray-100 rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

interface LoadingSkeletonProps {
  rows?: number
  type?: 'table' | 'cards' | 'chart'
}

export function LoadingSkeleton({ rows = 3, type = 'table' }: LoadingSkeletonProps) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-6 bg-gray-100 rounded w-28 mb-2" />
            <div className="h-2 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-gray-100 rounded flex-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

export function formatCurrency(value: number): string {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompact(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return formatCurrency(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
