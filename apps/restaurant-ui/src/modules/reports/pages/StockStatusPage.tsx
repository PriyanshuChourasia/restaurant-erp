import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { useStockStatus } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton } from '../components/ReportComponents'

const statusColors: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  low: 'bg-amber-50 text-amber-700 border-amber-200',
  out_of_stock: 'bg-red-50 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  ok: 'OK',
  low: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export function StockStatusPage() {
  const { data, isLoading } = useStockStatus()

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Stock Status"
        description="Current inventory levels across all items"
        icon={Package}
        iconColor="bg-amber-600"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Total Items</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{data?.summary.totalItems || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-gray-500">In Stock</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">{data?.summary.okCount || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-500">Low Stock</span>
          </div>
          <p className="text-xl font-bold text-amber-700">{data?.summary.lowStockCount || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-gray-500">Out of Stock</span>
          </div>
          <p className="text-xl font-bold text-red-700">{data?.summary.outOfStockCount || 0}</p>
        </div>
      </div>

      {/* Inventory Value */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Inventory Value</span>
          <span className="text-2xl font-bold text-gray-900">
            ₹{Number(data?.summary.totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Stock Table */}
      <ReportCard title="Inventory Details">
        {isLoading ? <LoadingSkeleton rows={10} /> : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Opening</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.itemId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{item.itemName}</span>
                      <span className="ml-2 text-xs text-gray-400">{item.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.categoryName}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.openingBalance} {item.unit}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.currentStock} {item.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.minStockLevel} {item.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-700">₹{item.unitCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">₹{item.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No inventory data</p>
        )}
      </ReportCard>
    </div>
  )
}
