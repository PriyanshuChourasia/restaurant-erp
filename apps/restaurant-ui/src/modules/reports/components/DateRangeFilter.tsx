import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'

export interface DateRange {
  fromDate: string
  toDate: string
}

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  showPresets?: boolean
  activePreset?: string
  onPresetChange?: (preset: string) => void
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function computePreset(preset: string): DateRange {
  const today = new Date()
  const toDate = formatDate(today)
  let fromDate: string

  switch (preset) {
    case 'today':
      fromDate = toDate
      break
    case 'yesterday': {
      const y = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      fromDate = formatDate(y)
      return { fromDate, toDate: formatDate(y) }
    }
    case 'week':
      fromDate = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
      break
    case 'month':
      fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
      break
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3)
      fromDate = formatDate(new Date(today.getFullYear(), q * 3, 1))
      break
    }
    case 'year':
      fromDate = formatDate(new Date(today.getFullYear(), 0, 1))
      break
    case 'last-month': {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      return { fromDate: formatDate(lm), toDate: formatDate(lmEnd) }
    }
    default:
      fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return { fromDate, toDate }
}

const presets = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: '7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'This Year' },
] as const

export function useDateRange(initialPreset: 'today' | 'yesterday' | 'week' | 'month' | 'last-month' | 'quarter' | 'year' = 'month') {
  const [activePreset, setActivePreset] = useState<string>(initialPreset)
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  const range = useMemo(() => {
    if (customRange) return customRange
    return computePreset(activePreset)
  }, [activePreset, customRange])

  const setPreset = (preset: string) => {
    setActivePreset(preset)
    setCustomRange(null)
  }

  const setCustom = (r: DateRange) => {
    setCustomRange(r)
    setActivePreset('')
  }

  return { ...range, preset: activePreset, setPreset, setCustom }
}

export function DateRangeFilter({ value, onChange, showPresets = true, activePreset, onPresetChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPresets && (
        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => onPresetChange?.(p.key)}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                activePreset === p.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Calendar size={14} className="text-gray-400" />
        <input
          type="date"
          value={value.fromDate}
          onChange={(e) => onChange({ ...value, fromDate: e.target.value })}
          className="h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={value.toDate}
          onChange={(e) => onChange({ ...value, toDate: e.target.value })}
          className="h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
        />
      </div>
    </div>
  )
}
