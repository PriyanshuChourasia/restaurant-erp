import { useState, useMemo } from 'react'

export interface DateRange {
  fromDate: string
  toDate: string
}

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  showPresets?: boolean
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function useDateRange(initialPreset: 'today' | 'week' | 'month' | 'year' = 'month') {
  const [preset, setPreset] = useState(initialPreset)

  const range = useMemo(() => {
    const today = new Date()
    const toDate = formatDate(today)
    let fromDate: string

    switch (preset) {
      case 'today':
        fromDate = toDate
        break
      case 'week':
        fromDate = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
        break
      case 'month':
        fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        break
      case 'year':
        fromDate = formatDate(new Date(today.getFullYear(), 0, 1))
        break
    }

    return { fromDate, toDate }
  }, [preset])

  return { preset, setPreset, ...range }
}

export function DateRangeFilter({ value, onChange, showPresets = true }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPresets && (
        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                const today = new Date()
                const toDate = formatDate(today)
                let fromDate: string
                switch (p) {
                  case 'today': fromDate = toDate; break
                  case 'week': fromDate = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)); break
                  case 'month': fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1)); break
                  case 'year': fromDate = formatDate(new Date(today.getFullYear(), 0, 1)); break
                }
                onChange({ fromDate, toDate })
              }}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                value.fromDate === (() => {
                  const today = new Date()
                  const toDate = formatDate(today)
                  switch (p) {
                    case 'today': return toDate
                    case 'week': return formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
                    case 'month': return formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
                    case 'year': return formatDate(new Date(today.getFullYear(), 0, 1))
                  }
                })()
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      )}
      <input
        type="date"
        value={value.fromDate}
        onChange={(e) => onChange({ ...value, fromDate: e.target.value })}
        className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
      />
      <span className="text-xs text-gray-400">to</span>
      <input
        type="date"
        value={value.toDate}
        onChange={(e) => onChange({ ...value, toDate: e.target.value })}
        className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
      />
    </div>
  )
}
