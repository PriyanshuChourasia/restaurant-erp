import { useState } from 'react'
import { Package, AlertTriangle, XCircle, CheckCircle, Search, Filter } from 'lucide-react'
import { useStockStatus } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, ProgressBar, formatCurrency, SectionHeader } from '../components/ReportComponents'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  ok: { label: 'In Stock', variant: 'success' },
  low: { label: 'Low Stock', variant: 'warning' },
  out_of_stock: { label: 'Out of Stock', variant: 'danger' },
}

export function StockStatusPage() {
  const { data, isLoading } = useStockStatus()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredItems = data?.items?.filter((item) => {
    const matchesSearch = search === '' ||
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Stock Status"
        description="Current inventory levels across all items"
        icon={Package}
        iconColor="bg-amber-600"
        badge={summary ? { label: `${summary.totalItems} items`, color: 'bg-amber-100 text-amber-700' } : undefined}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Total Items</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary?.totalItems || 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">In Stock</span>
          </div>
          <p className="text-xl font-bold text-emerald-800">{summary?.okCount || 0}</p>
          {summary && summary.totalItems > 0 && (
            <p className="text-xs text-emerald-600 mt-1">{((summary.okCount / summary.totalItems) * 100).toFixed(0)}%</p>
          )}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Low Stock</span>
          </div>
          <p className="text-xl font-bold text-amber-800">{summary?.lowStockCount || 0}</p>
          {summary && summary.totalItems > 0 && (
            <p className="text-xs text-amber-600 mt-1">{((summary.lowStockCount / summary.totalItems) * 100).toFixed(0)}%</p>
          )}
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Out of Stock</span>
          </div>
          <p className="text-xl font-bold text-red-800">{summary?.outOfStockCount || 0}</p>
          {summary && summary.totalItems > 0 && (
            <p className="text-xs text-red-600 mt-1">{((summary.outOfStockCount / summary.totalItems) * 100).toFixed(0)}%</p>
          )}
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Total Value</span>
          </div>
          <p className="text-xl font-bold text-blue-800">{formatCurrency(summary?.totalValue || 0)}</p>
        </div>
      </div>

      {/* Stock Health Bar */}
      {summary && summary.totalItems > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Stock Health" subtitle={`${summary.totalItems} items tracked`} />
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(summary.okCount / summary.totalItems) * 100}%` }}
              title={`In Stock: ${summary.okCount}`}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(summary.lowStockCount / summary.totalItems) * 100}%` }}
              title={`Low Stock: ${summary.lowStockCount}`}
            />
            <div
              className="bg-red-500 h-full transition-all"
              style={{ width: `${(summary.outOfStockCount / summary.totalItems) * 100}%` }}
              title={`Out of Stock: ${summary.outOfStockCount}`}
            />
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-xs text-gray-600">In Stock ({summary.okCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-gray-600">Low ({summary.lowStockCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs text-gray-600">Out ({summary.outOfStockCount})</span>
            </div>
          </div>
        </div>
      )}

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
          <Filter size={14} className="text-gray-400" />
          {['all', 'ok', 'low', 'out_of_stock'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <ReportCard title="Inventory Details" subtitle={`${filteredItems.length} items${search || statusFilter !== 'all' ? ' (filtered)' : ''}`}>
        {isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Opening</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Stock Level</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const barColor = item.status === 'ok' ? 'bg-emerald-500' : item.status === 'low' ? 'bg-amber-500' : 'bg-red-500'
                  return (
                    <tr key={item.itemId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{item.itemName}</span>
                        {item.sku && <span className="ml-2 text-xs text-gray-400 font-mono">{item.sku}</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{item.categoryName}</td>
                      <td className="py-3 px-4 text-right text-gray-700"><FormattedQuantity quantity={item.openingBalance} unit={item.unit} variant="full" /></td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900"><FormattedQuantity quantity={item.currentStock} unit={item.unit} variant="full" /></td>
                      <td className="py-3 px-4 text-right text-gray-700"><FormattedQuantity quantity={item.minStockLevel} unit={item.unit} variant="full" /></td>
                      <td className="py-3 px-4 w-32">
                        <ProgressBar value={item.currentStock} max={item.minStockLevel * 2} color={barColor} height="h-1.5" />
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{item.unitCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.stockValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={statusConfig[item.status]?.label || item.status}
                          variant={statusConfig[item.status]?.variant || 'neutral'}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title={search || statusFilter !== 'all' ? 'No matching items' : 'No inventory data'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No items in inventory yet'}
          />
        )}
      </ReportCard>
    </div>
  )
}
