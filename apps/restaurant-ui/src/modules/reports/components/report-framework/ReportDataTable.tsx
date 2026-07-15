import { useState } from 'react'
import { Search } from 'lucide-react'
import { LoadingSkeleton, EmptyState, formatCurrency, formatPercent } from '../ReportComponents'
import type { ReportColumn } from '../../types/report-config.types'

function formatCellValue(value: any, format?: string): string {
  if (value === undefined || value === null) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return String(value)
  switch (format) {
    case 'currency': return formatCurrency(num)
    case 'percent': return formatPercent(num)
    case 'decimal': return num.toFixed(2)
    case 'date':
      return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    default:
      return typeof value === 'number' ? num.toLocaleString('en-IN') : String(value)
  }
}

interface ReportDataTableProps {
  data: Record<string, any>[] | undefined | null
  columns: ReportColumn[]
  isLoading: boolean
  searchable?: boolean
  searchFields?: string[]
  keyField?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function ReportDataTable({ data, columns, isLoading, searchable, searchFields, keyField = 'id', emptyTitle = 'No data', emptyDescription = 'No data found for the selected period' }: ReportDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = searchable && searchFields?.length && data
    ? data.filter((row) =>
        searchFields.some((field) =>
          String(row[field] || '').toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    : data

  const alignClass = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {(searchable || (data && data.length > 0)) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-semibold text-gray-900">
            {data ? `${data.length} records` : ''}
          </h3>
          {searchable && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-gray-400 w-48"
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="px-5 pb-5">
          <LoadingSkeleton type="table" rows={5} />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState icon={Search} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col.accessorKey}
                    className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase ${alignClass(col.align)}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row[keyField] || idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.accessorKey} className={`py-3 px-4 ${alignClass(col.align)} text-gray-700`}>
                      {formatCellValue(row[col.accessorKey], col.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
