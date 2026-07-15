import { useState } from 'react'
import { ClipboardList, Search, ArrowUpDown, Package } from 'lucide-react'
import { useStockMovements } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  purchase: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  sale: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  adjustment: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  wastage: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  transfer: { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  production: { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
}

export function StockMovementPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useStockMovements(fromDate, toDate)
  const [search, setSearch] = useState('')

  const items = data?.items || []
  const filtered = items.filter((item) =>
    search === '' ||
    item.itemName.toLowerCase().includes(search.toLowerCase()) ||
    item.movementType.toLowerCase().includes(search.toLowerCase()) ||
    (item.reference || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Stock Movement Ledger"
        description="Complete audit trail of all inventory transactions"
        icon={ClipboardList}
        iconColor="bg-indigo-600"
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpDown size={16} className="text-indigo-500" />
            <span className="text-sm font-medium text-indigo-700">Total Movements</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{isLoading ? '...' : data?.totalMovements ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Items Affected</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{isLoading ? '...' : data?.uniqueItems ?? 0}</p>
        </div>
      </div>

      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search item, type, reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
        />
      </div>

      <ReportCard title="Transaction Ledger" subtitle={`${filtered.length} movements${search ? ' (filtered)' : ''}`}>
        {isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Before</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">After</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const style = TYPE_STYLES[item.movementType] || TYPE_STYLES.adjustment
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {item.movementType.charAt(0).toUpperCase() + item.movementType.slice(1)}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${item.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.quantity >= 0 ? '+' : ''}{item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{item.balanceBefore}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{item.balanceAfter}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{item.reference || '—'}</td>
                      <td className="py-3 px-4 text-xs text-gray-400 max-w-[200px] truncate">{item.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No movements" description="No stock movements in this period." />
        )}
      </ReportCard>
    </div>
  )
}
