import { useState } from 'react'
import { ListOrdered, Search, CookingPot, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAllKots, useUpdateKotStatus } from '../hooks/useKotQueries'
import { STATIONS, STATION_LABELS, STATUS_COLORS, STATUS_LABELS } from '../types'

export function KotListPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [stationFilter, setStationFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAllKots({ page, limit: 20, status: statusFilter || undefined, station: stationFilter || undefined })
  const markKot = useUpdateKotStatus()

  const kots = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const filtered = search
    ? kots.filter((k) =>
        k.kotNumber.toLowerCase().includes(search.toLowerCase()) ||
        k.items.some((i) => i.itemName.toLowerCase().includes(search.toLowerCase()))
      )
    : kots

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <ListOrdered size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">KOT History</h1>
          <p className="text-xs text-gray-400">All kitchen order tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by KOT# or item..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={stationFilter} onChange={(e) => { setStationFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All Stations</option>
          {STATIONS.map((s) => (
            <option key={s} value={s}>{STATION_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KOT #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Station</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tables</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  <CookingPot size={24} className="mx-auto mb-2 opacity-30" />
                  No KOTs found
                </td></tr>
              ) : (
                filtered.map((kot) => (
                  <tr key={kot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900">{kot.kotNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[kot.status]}`}>
                        {STATUS_LABELS[kot.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{STATION_LABELS[kot.station]}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {kot.items.map((item) => (
                          <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {item.quantity}x {item.itemName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{kot.tableIds?.join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(kot.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {kot.status === 'pending' && (
                          <button onClick={() => markKot.mutate({ id: kot.id, status: 'preparing' })}
                            className="px-2 py-1 text-[10px] rounded bg-blue-500 text-white hover:bg-blue-600 font-medium">
                            Start
                          </button>
                        )}
                        {kot.status === 'preparing' && (
                          <button onClick={() => markKot.mutate({ id: kot.id, status: 'ready' })}
                            className="px-2 py-1 text-[10px] rounded bg-emerald-500 text-white hover:bg-emerald-600 font-medium">
                            Ready
                          </button>
                        )}
                        {kot.status === 'ready' && (
                          <button onClick={() => markKot.mutate({ id: kot.id, status: 'served' })}
                            className="px-2 py-1 text-[10px] rounded bg-gray-700 text-white hover:bg-gray-800 font-medium">
                            Serve
                          </button>
                        )}
                        {(kot.status === 'pending' || kot.status === 'preparing') && (
                          <button onClick={() => markKot.mutate({ id: kot.id, status: 'cancelled' })}
                            className="px-2 py-1 text-[10px] rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
