import { type LucideIcon } from 'lucide-react'

interface ReportPageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  children?: React.ReactNode
}

export function ReportPageHeader({ title, description, icon: Icon, iconColor = 'bg-gray-900', children }: ReportPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor} text-white`}>
          <Icon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  color?: string
}

export function KpiCard({ label, value, subtitle, color = 'gray' }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className={`text-xl font-bold text-${color}-900 mt-1`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

interface ReportCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ReportCard({ title, children, className = '' }: ReportCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

interface LoadingSkeletonProps {
  rows?: number
}

export function LoadingSkeleton({ rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-gray-100 rounded flex-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  )
}
