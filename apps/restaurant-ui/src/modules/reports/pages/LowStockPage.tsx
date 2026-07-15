import { AlertTriangle, XCircle, CheckCircle, Search, Package } from 'lucide-react'
import { useLowStockAlerts } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, StatusBadge, ProgressBar } from '../components/ReportComponents'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'
import { useState } from 'react'

export function LowStockPage() {
  const { data, isLoading } = useLowStockAlerts()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'out' | 'low'>('all')

  const items = data?.items || []

  const filteredItems = items.filter((item) => {
    const matchesSearch = search === '' ||
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(search.toLowerCase())
    const matchesSeverity = severityFilter === 'all' ||
      (severityFilter === 'out' && item.isOut) ||
      (severityFilter === 'low' && !item.isOut)
    return matchesSearch && matchesSeverity
  }) || []

  const totalDeficit = filteredItems.reduce((sum, i) => sum + i.deficit, 0)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Low Stock Alerts"
        description="Items that need restocking attention"
        icon={AlertTriangle}
        iconColor="bg-red-600"
        badge={data?.totalAlerts ? { label: `${data.totalAlerts} alerts`, color: 'bg-red-100 text-red-700' } : undefined}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Total Alerts</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{data?.totalAlerts || 0}</p>
          <p className="text-xs text-red-600 mt-1">items need attention</p>
        </div>
        <div className="rounded-xl border border-red-300 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-800">Out of Stock</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{data?.outOfStock || 0}</p>
          <p className="text-xs text-red-700 mt-1">completely depleted</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-amber-800">{data?.lowStock || 0}</p>
          <p className="text-xs text-amber-600 mt-1">below minimum level</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-700">Total Deficit</span>
          </div>
          <p className="text-2xl font-bold text-orange-800">{totalDeficit}</p>
          <p className="text-xs text-orange-600 mt-1">units needed to restore</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, SKU, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All Alerts', count: data?.totalAlerts || 0 },
            { key: 'out', label: 'Out of Stock', count: data?.outOfStock || 0 },
            { key: 'low', label: 'Low Stock', count: data?.lowStock || 0 },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key as typeof severityFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                severityFilter === f.key
                  ? f.key === 'out' ? 'bg-red-600 text-white' : f.key === 'low' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Alert Table */}
      <ReportCard
        title="Items Requiring Attention"
        subtitle={`${filteredItems.length} items${search || severityFilter !== 'all' ? ' (filtered)' : ''}`}
      >
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Deficit</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Stock Level</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const barPct = item.minStockLevel > 0 ? (item.currentStock / item.minStockLevel) * 100 : 0
                  const barColor = item.isOut ? 'bg-red-500' : 'bg-amber-500'
                  return (
                    <tr key={item.itemId} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${item.isOut ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {item.isOut ? (
                            <XCircle size={14} className="text-red-500 shrink-0" />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{item.itemName}</span>
                            {item.sku && <span className="ml-2 text-xs text-gray-400 font-mono">{item.sku}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{item.categoryName}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${item.isOut ? 'text-red-700' : 'text-amber-700'}`}>
                          <FormattedQuantity quantity={item.currentStock} unit={item.unit} variant="full" />
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700"><FormattedQuantity quantity={item.minStockLevel} unit={item.unit} variant="full" /></td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-red-600">-<FormattedQuantity quantity={item.deficit} unit={item.unit} variant="full" /></span>
                      </td>
                      <td className="py-3 px-4 w-32">
                        <ProgressBar
                          value={item.currentStock}
                          max={item.minStockLevel}
                          color={barColor}
                          height="h-1.5"
                        />
                        <p className="text-[10px] text-gray-400 text-right mt-0.5">{barPct.toFixed(0)}% of min</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={item.isOut ? 'Out of Stock' : 'Low Stock'}
                          variant={item.isOut ? 'danger' : 'warning'}
                          icon={item.isOut ? XCircle : AlertTriangle}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search || severityFilter !== 'all' ? 'No matching items' : 'All items are well-stocked'}
            </h3>
            <p className="text-sm text-gray-500">
              {search || severityFilter !== 'all' ? 'Try adjusting your filters' : 'No low stock alerts at this time'}
            </p>
          </div>
        )}
      </ReportCard>
    </div>
  )
}
