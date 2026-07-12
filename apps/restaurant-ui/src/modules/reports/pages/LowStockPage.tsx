import { AlertTriangle, XCircle } from 'lucide-react'
import { useLowStockAlerts } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton } from '../components/ReportComponents'

export function LowStockPage() {
  const { data, isLoading } = useLowStockAlerts()

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Low Stock Alerts"
        description="Items that need restocking attention"
        icon={AlertTriangle}
        iconColor="bg-amber-600"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <span className="text-sm font-medium text-gray-500">Total Alerts</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{data?.totalAlerts || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-gray-500">Out of Stock</span>
          </div>
          <p className="text-xl font-bold text-red-700 mt-1">{data?.outOfStock || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-500">Low Stock</span>
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1">{data?.lowStock || 0}</p>
        </div>
      </div>

      {/* Alert Table */}
      <ReportCard title="Items Requiring Attention">
        {isLoading ? <LoadingSkeleton rows={8} /> : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Deficit</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Severity</th>
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
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.currentStock} {item.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.minStockLevel} {item.unit}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">{item.deficit} {item.unit}</td>
                    <td className="py-3 px-4 text-center">
                      {item.isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={12} /> Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle size={12} /> Low
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3" />
            <p className="text-sm text-gray-500">All items are well-stocked</p>
          </div>
        )}
      </ReportCard>
    </div>
  )
}

function CheckCircle(props: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
