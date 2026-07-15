import { useState } from 'react'
import { CookingPot, Timer, UtensilsCrossed, XCircle, Search, RefreshCw, ChefHat, Table, AlertTriangle } from 'lucide-react'
import { useKitchenQueueStatus } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState } from '../components/ReportComponents'

const STATIONS = [
  { key: 'all', label: 'All Stations', icon: CookingPot },
  { key: 'main_kitchen', label: 'Main Kitchen', icon: ChefHat },
  { key: 'tandoor', label: 'Tandoor', icon: CookingPot },
  { key: 'beverages', label: 'Beverages', icon: UtensilsCrossed },
  { key: 'desserts', label: 'Desserts', icon: UtensilsCrossed },
  { key: 'snacks', label: 'Snacks', icon: UtensilsCrossed },
]

const STATUS_STYLES: Record<string, { badge: 'info' | 'warning' | 'success' | 'danger' | 'neutral'; bg: string; dot: string }> = {
  pending: { badge: 'warning', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  preparing: { badge: 'info', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  ready: { badge: 'success', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  served: { badge: 'neutral', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
  cancelled: { badge: 'danger', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
}

function elapsedColor(minutes: number): string {
  if (minutes <= 5) return 'text-emerald-600'
  if (minutes <= 10) return 'text-amber-600'
  return 'text-red-600'
}

export function KitchenQueueStatusPage() {
  const { data, isLoading, isFetching, refetch } = useKitchenQueueStatus()
  const [search, setSearch] = useState('')
  const [stationFilter, setStationFilter] = useState('all')

  const items = data?.items || []
  const filteredItems = items.filter((item) => {
    const matchesSearch = search === '' ||
      item.kotNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.tables.toLowerCase().includes(search.toLowerCase()) ||
      item.station.toLowerCase().includes(search.toLowerCase())
    const matchesStation = stationFilter === 'all' || item.station === stationFilter
    return matchesSearch && matchesStation
  })

  const stats = [
    { label: 'Pending', value: data?.pending ?? 0, color: 'amber', icon: Timer, subtitle: 'Awaiting preparation' },
    { label: 'Preparing', value: data?.preparing ?? 0, color: 'blue', icon: CookingPot, subtitle: 'In progress' },
    { label: 'Ready', value: data?.ready ?? 0, color: 'emerald', icon: UtensilsCrossed, subtitle: 'Ready to serve' },
    { label: 'Overdue', value: data?.overdue ?? 0, color: 'red', icon: XCircle, subtitle: 'Exceeded 15 min' },
  ]

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Kitchen Order Queue"
        description="Real-time order tracking by station and status"
        icon={CookingPot}
        iconColor="bg-orange-600"
        badge={data ? { label: `${items.length} active KOTs`, color: 'bg-orange-100 text-orange-700' } : undefined}
      >
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </ReportPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border border-${s.color}-200 bg-${s.color}-50 p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium text-${s.color}-700`}>{s.label}</span>
              <s.icon size={18} className={`text-${s.color}-500`} />
            </div>
            <p className={`text-2xl font-bold text-${s.color}-900`}>
              {isLoading ? '...' : s.value}
            </p>
            <p className={`text-xs text-${s.color}-600 mt-1`}>{s.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Station Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search KOT #, table, station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStationFilter(s.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                stationFilter === s.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <s.icon size={12} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <ReportCard
        title="Active Orders"
        subtitle={`${filteredItems.length} KOTs${search || stationFilter !== 'all' ? ' (filtered)' : ''}`}
      >
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">KOT #</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Station</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Tables</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Elapsed</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Priority</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const style = STATUS_STYLES[item.status] || STATUS_STYLES.pending
                  const isOverdue = item.elapsedMinutes > 15
                  return (
                    <tr
                      key={item.kotNumber}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-gray-900">{item.kotNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {item.station.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Table size={13} className="text-gray-400" />
                          {item.tables || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-gray-900">{item.itemCount}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${elapsedColor(item.elapsedMinutes)}`}>
                          {item.elapsedMinutes < 60
                            ? `${item.elapsedMinutes}m`
                            : `${Math.floor(item.elapsedMinutes / 60)}h ${item.elapsedMinutes % 60}m`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle size={11} />
                            Overdue
                          </span>
                        ) : item.elapsedMinutes > 10 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            <Timer size={11} />
                            Urgent
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CookingPot}
            title={search || stationFilter !== 'all' ? 'No matching orders' : 'No active orders'}
            description={search || stationFilter !== 'all' ? 'Try adjusting your filters' : 'All KOTs have been served. The kitchen is idle.'}
          />
        )}
      </ReportCard>
    </div>
  )
}
