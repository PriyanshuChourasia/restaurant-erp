import { useState } from 'react'
import { Search, Package, Hash, Archive, ArrowLeft, RefreshCw } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useDevStockItems } from '../hooks/useStockItemQueries'

const GROUP_OPTIONS = [
  { value: '', label: 'All Groups' },
  { value: 'RM', label: 'Raw Mat.' },
  { value: 'FG', label: 'Finished' },
  { value: 'PKG', label: 'Packaging' },
]

const groupBadge = (code: string | undefined) => {
  switch (code) {
    case 'RM': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'FG': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'PKG': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function DeveloperStockItemsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const { data, isLoading, refetch, isFetching } = useDevStockItems({
    page,
    limit: 20,
    search: search || undefined,
    group: groupFilter || undefined,
  })

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/developer"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Archive size={18} className="text-violet-500" />
              Stock Items
            </h1>
            <p className="text-xs text-gray-400">{total} items in master</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-8 w-48 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Group Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {GROUP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setGroupFilter(opt.value); setPage(1) }}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
              groupFilter === opt.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-violet-500 rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Archive size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-600">No stock items found</p>
          <p className="text-xs">{search || groupFilter ? 'Try different filters.' : 'No items in master.'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Code</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Name</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Group</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">UOM</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">HSN</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">GST</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Reorder</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Barcode</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                          <Hash size={12} />
                        </div>
                        <span className="font-mono font-semibold text-gray-900">{item.code}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.alias && <p className="text-[10px] text-gray-400">{item.alias}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {item.stockGroup ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${groupBadge(item.stockGroup.code)}`}>
                          {item.stockGroup.code}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.stockCategory ? (
                        <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {item.stockCategory.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.unitOfMeasure ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          <Package size={10} className="text-gray-400" />
                          {item.unitOfMeasure.code}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.hsnCode ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium">{item.hsnCode}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.gstRate != null ? (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-medium">{item.gstRate}%</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.reorderLevel != null && item.reorderLevel > 0
                        ? `${item.reorderLevel} ${item.unitOfMeasure?.code || ''}`
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      {item.barcode ? (
                        <span className="text-[11px] text-gray-500 font-mono">{item.barcode}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {item.trackBatch && (
                          <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-medium">Batch</span>
                        )}
                        {item.trackExpiry && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium">Expiry</span>
                        )}
                        {!item.trackBatch && !item.trackExpiry && (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
              <p className="text-xs text-gray-400">
                Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
