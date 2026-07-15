import { Layers, TrendingUp, BarChart3 } from 'lucide-react'
import { useSalesByCategory } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, HorizontalBarChart, StatusBadge, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const barColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500',
]

export function CategorySalesPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useSalesByCategory(fromDate, toDate)

  const topCategory = data?.categories?.length
    ? data.categories.reduce((max, c) => c.revenue > max.revenue ? c : max, data.categories[0])
    : null

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales by Category"
        description="Revenue breakdown by menu category"
        icon={Layers}
        iconColor="bg-violet-600"
        badge={data?.categories?.length ? { label: `${data.categories.length} categories`, color: 'bg-violet-100 text-violet-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* Top Category Highlight */}
      {topCategory && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-violet-600 font-medium">Top Performing Category</p>
              <p className="text-lg font-bold text-violet-900">
                {topCategory.categoryName} — {formatCurrency(topCategory.revenue)} ({topCategory.percentage.toFixed(1)}% of total)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <ReportCard title="Revenue by Category" subtitle="Ranked by revenue">
          {isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : data?.categories && data.categories.length > 0 ? (
            <div className="space-y-3">
              {data.categories.slice(0, 10).map((c, i) => {
                const width = data.grandTotal > 0 ? (c.revenue / data.grandTotal) * 100 : 0
                const avgPrice = c.quantitySold > 0 ? c.revenue / c.quantitySold : 0
                return (
                  <div key={c.categoryId || 'none'} className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-medium text-gray-600 truncate block" title={c.categoryName}>
                          {c.categoryName}
                        </span>
                        {c.categoryLevel > 0 && (
                          <span className="text-[10px] text-gray-400">Level {c.categoryLevel}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-50 rounded overflow-hidden">
                          <div
                            className={`h-full ${barColors[i % barColors.length]} rounded transition-all group-hover:opacity-80`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-36 text-right shrink-0">
                        <span className="text-xs font-semibold text-gray-900">{formatCurrency(c.revenue)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{c.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-27 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-gray-400">{c.quantitySold} sold · ₹{avgPrice.toFixed(0)} avg</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Layers} title="No category data" description="No sales data for the selected period" />
          )}
        </ReportCard>

        {/* Revenue Share */}
        <ReportCard title="Revenue Share" subtitle="Proportional breakdown">
          {data?.categories && data.categories.length > 0 ? (
            <HorizontalBarChart
              segments={data.categories.slice(0, 8).map((c, i) => ({
                label: c.categoryName,
                value: c.revenue,
                color: barColors[i % barColors.length],
              }))}
            />
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="Select a period with sales data" />
          )}
        </ReportCard>

        {/* Category KPI Grid */}
        {data?.categories && data.categories.length > 0 && (
          <ReportCard title="Category Performance" subtitle="Key metrics per category" className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.categories.slice(0, 10).map((c, i) => {
                const avgPrice = c.quantitySold > 0 ? c.revenue / c.quantitySold : 0
                return (
                  <div key={c.categoryId || 'none'} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded ${barColors[i % barColors.length]}`} />
                      <span className="text-xs font-medium text-gray-700 truncate">{c.categoryName}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(c.revenue)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.quantitySold} items · ₹{avgPrice.toFixed(0)} avg</p>
                  </div>
                )
              })}
            </div>
          </ReportCard>
        )}
      </div>

      {/* Detail Table */}
      {data && data.categories.length > 0 && (
        <ReportCard
          title="Category Details"
          subtitle={`Total: ${formatCurrency(data.grandTotal)} across ${data.categories.length} categories`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Share</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Visual</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c, i) => {
                  const avgPrice = c.quantitySold > 0 ? c.revenue / c.quantitySold : 0
                  return (
                    <tr key={c.categoryId || 'none'} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-400 font-medium">#{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded ${barColors[i % barColors.length]}`} />
                          <span className="font-medium text-gray-900">{c.categoryName}</span>
                          {c.categoryLevel > 0 && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">L{c.categoryLevel}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.quantitySold}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(c.revenue)}</td>
                      <td className="py-3 px-4 text-right">
                        <StatusBadge
                          status={`${c.percentage.toFixed(1)}%`}
                          variant={c.percentage > 20 ? 'success' : c.percentage > 10 ? 'info' : 'neutral'}
                        />
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{avgPrice.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                  <td className="py-3 px-4" />
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">{data.categories.reduce((s, c) => s + c.quantitySold, 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(data.grandTotal)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">100%</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{data.categories.reduce((s, c) => s + c.quantitySold, 0) > 0
                      ? (data.grandTotal / data.categories.reduce((s, c) => s + c.quantitySold, 0)).toFixed(2)
                      : '0.00'}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
