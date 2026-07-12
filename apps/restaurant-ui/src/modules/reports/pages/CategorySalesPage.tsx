import { Layers } from 'lucide-react'
import { useSalesByCategory } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const barColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]

export function CategorySalesPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data, isLoading } = useSalesByCategory(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales by Category"
        description="Revenue breakdown by menu category"
        icon={Layers}
        iconColor="bg-violet-600"
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <ReportCard title="Revenue by Category">
          {isLoading ? <LoadingSkeleton rows={6} /> : data?.categories && data.categories.length > 0 ? (
            <div className="space-y-3">
              {data.categories.slice(0, 10).map((c, i) => {
                const width = data.grandTotal > 0 ? (c.revenue / data.grandTotal) * 100 : 0
                return (
                  <div key={c.categoryId || 'none'} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 shrink-0 truncate" title={c.categoryName}>{c.categoryName}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded overflow-hidden">
                      <div className={`h-full ${barColors[i % barColors.length]} rounded`} style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-24 text-right">₹{c.revenue.toLocaleString('en-IN')}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No category data for selected period</p>
          )}
        </ReportCard>

        {/* Category Pie (approximated as stacked bar) */}
        <ReportCard title="Revenue Share">
          {data?.categories && data.categories.length > 0 ? (
            <>
              <div className="h-8 rounded-lg overflow-hidden flex bg-gray-50 mb-4">
                {data.categories.slice(0, 8).map((c, i) => (
                  <div
                    key={c.categoryId || 'none'}
                    className={`${barColors[i % barColors.length]} transition-all hover:opacity-90`}
                    style={{ width: `${c.percentage}%` }}
                    title={`${c.categoryName}: ₹${c.revenue.toLocaleString('en-IN')} (${c.percentage.toFixed(1)}%)`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {data.categories.slice(0, 8).map((c, i) => (
                  <div key={c.categoryId || 'none'} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${barColors[i % barColors.length]}`} />
                      <span className="text-sm text-gray-700">{c.categoryName}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{c.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No data</p>
          )}
        </ReportCard>
      </div>

      {/* Detail Table */}
      {data && data.categories.length > 0 && (
        <ReportCard title="Category Details">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.categoryId || 'none'} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{c.categoryName}</span>
                      {c.categoryLevel > 0 && (
                        <span className="ml-2 text-xs text-gray-400">L{c.categoryLevel}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.quantitySold}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">₹{c.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.percentage.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      ₹{c.quantitySold > 0 ? (c.revenue / c.quantitySold).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">{data.categories.reduce((s, c) => s + c.quantitySold, 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">₹{data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right text-gray-900">100%</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{data.categories.reduce((s, c) => s + c.quantitySold, 0) > 0
                      ? (data.grandTotal / data.categories.reduce((s, c) => s + c.quantitySold, 0)).toFixed(2)
                      : '0.00'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
