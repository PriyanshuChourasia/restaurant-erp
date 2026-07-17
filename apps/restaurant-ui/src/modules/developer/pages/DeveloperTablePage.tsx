import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Database, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react'
import { useDevTableData, useDevTableColumns } from '../hooks/useDeveloper'

const PAGE_SIZE = 50

export function DeveloperTablePage() {
  const { tableName } = useParams({ from: '/developer/_developer/tables/$tableName' })
  const [page, setPage] = useState(0)
  const [showColumns, setShowColumns] = useState(false)

  const { data: tableData, isLoading, refetch, isFetching } = useDevTableData(tableName, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const { data: columns } = useDevTableColumns(tableName)

  const rows = tableData?.data || []
  const total = tableData?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const cols = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            to="/developer"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Database size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{tableName}</h1>
              <p className="text-xs text-gray-400">
                {total} rows · {columns?.length || 0} columns
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumns(!showColumns)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showColumns
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Columns3 size={12} />
            Schema
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {showColumns && columns && columns.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table Schema</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Column</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Nullable</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {columns.map((col) => (
                  <tr key={col.columnName} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-700">{col.columnName}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {col.dataType}
                      {col.maxLength ? `(${col.maxLength})` : ''}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{col.isNullable === 'YES' ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-gray-400 font-mono text-[10px]">{col.columnDefault || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-violet-500 rounded-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Database size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No data in this table</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {cols.map((col) => (
                    <th key={col} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row: Record<string, any>, idx: number) => (
                  <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    {cols.map((col) => (
                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
              <p className="text-xs text-gray-400">
                Page {page + 1} of {totalPages} · {total} total rows
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatCell(value: any): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
