import { AlertTriangle, Clock } from 'lucide-react'
import type { JSX } from 'react'

export type BatchStatus = 'active' | 'exhausted' | 'expired' | 'written_off'

export const STATUS_CONFIG: Record<BatchStatus, { label: string; class: string; dot: string }> = {
  active: {
    label: 'Active',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  exhausted: {
    label: 'Exhausted',
    class: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  expired: {
    label: 'Expired',
    class: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  written_off: {
    label: 'Written Off',
    class: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
}

export const STATUS_FILTER_OPTIONS: { value: BatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'expired', label: 'Expired' },
  { value: 'written_off', label: 'Written Off' },
]

export function daysUntil(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function BatchExpiryBadge({ expiryDate }: { expiryDate: string | null }): JSX.Element {
  const days = daysUntil(expiryDate)
  if (days === null) return <span className="text-xs text-gray-400">No expiry</span>
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
        <AlertTriangle size={10} /> Expired {Math.abs(days)}d ago
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        <Clock size={10} /> {days}d left
      </span>
    )
  }
  return <span className="text-xs text-gray-500">{days}d left</span>
}

export function getExpiryAlertLevel(expiryDate: string | null): 'critical' | 'warning' | 'ok' | 'none' {
  const days = daysUntil(expiryDate)
  if (days === null) return 'none'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'ok'
}
