import { Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useHourlyDistribution } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

function getMealPeriod(hour: number): string {
  if (hour >= 6 && hour < 11) return 'Breakfast'
  if (hour >= 11 && hour < 16) return 'Lunch'
  if (hour >= 16 && hour < 20) return 'Snacks'
  if (hour >= 20 && hour < 24) return 'Dinner'
  return 'Late Night'
}

const mealColors: Record<string, string> = {
  Breakfast: 'bg-amber-500',
  Lunch: 'bg-emerald-500',
  Snacks: 'bg-blue-500',
  Dinner: 'bg-violet-500',
  'Late Night': 'bg-gray-500',
}

export function HourlyDistributionPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useHourlyDistribution(fromDate, toDate)

  const activeHours = data?.hours?.filter(h => h.orderCount > 0) || []
  const peakHour = activeHours.length > 0
    ? activeHours.reduce((max, h) => h.totalSales > max.totalSales ? h : max, activeHours[0])
    : null
  const quietHour = activeHours.length > 0
    ? activeHours.reduce((min, h) => h.totalSales < min.totalSales ? h : min, activeHours[0])
    : null
  const maxSales = peakHour?.totalSales || 1

  // Aggregate by meal period
  const mealPeriods = activeHours.reduce<Record<string, { orders: number; sales: number }>>((acc, h) => {
    const period = getMealPeriod(h.hour)
    if (!acc[period]) acc[period] = { orders: 0, sales: 0 }
    acc[period].orders += h.orderCount
    acc[period].sales += h.totalSales
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Hourly Distribution"
        description="Order patterns by time of day"
        icon={Clock}
        iconColor="bg-indigo-600"
        badge={activeHours.length > 0 ? { label: `${activeHours.length} active hours`, color: 'bg-indigo-100 text-indigo-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* Peak/Off-Peak Highlights */}
      {peakHour && quietHour && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700">Peak Hour</span>
            </div>
            <p className="text-xl font-bold text-indigo-900">{getHourLabel(peakHour.hour)}</p>
            <p className="text-xs text-indigo-600 mt-1">
              {peakHour.orderCount} orders · {formatCurrency(peakHour.totalSales)} revenue
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-amber-700">Quietest Hour</span>
            </div>
            <p className="text-xl font-bold text-amber-900">{getHourLabel(quietHour.hour)}</p>
            <p className="text-xs text-amber-600 mt-1">
              {quietHour.orderCount} orders · {formatCurrency(quietHour.totalSales)} revenue
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Busiest Meal Period</span>
            </div>
            {Object.entries(mealPeriods).length > 0 ? (() => {
              const busiest = Object.entries(mealPeriods).reduce((max, [k, v]) => v.sales > max[1].sales ? [k, v] : max, ['', { orders: 0, sales: 0 }])
              return (
                <>
                  <p className="text-xl font-bold text-gray-900">{busiest[0]}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {busiest[1].orders} orders · {formatCurrency(busiest[1].sales)} revenue
                  </p>
                </>
              )
            })() : null}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Chart */}
        <ReportCard title="Orders by Hour" subtitle="24-hour distribution" className="lg:col-span-2">
          {isLoading ? (
            <LoadingSkeleton type="chart" />
          ) : data?.hours && data.hours.length > 0 ? (
            <div className="space-y-1">
              {data.hours.map((h) => {
                const width = maxSales > 0 ? (h.totalSales / maxSales) * 100 : 0
                const period = getMealPeriod(h.hour)
                const color = mealColors[period] || 'bg-gray-500'
                const isPeak = peakHour && h.hour === peakHour.hour
                return (
                  <div key={h.hour} className={`flex items-center gap-3 p-1 rounded ${isPeak ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}>
                    <div className="w-16 shrink-0 text-right">
                      <span className={`text-xs font-medium ${isPeak ? 'text-indigo-700' : 'text-gray-500'}`}>
                        {getHourLabel(h.hour)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-50 rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${color} transition-all`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-28 text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-900">{h.orderCount} ord</span>
                      <span className="text-[10px] text-gray-400 ml-1">{formatCurrency(h.totalSales)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Clock} title="No hourly data" description="No orders found for the selected period" />
          )}
        </ReportCard>

        {/* Meal Period Breakdown */}
        <ReportCard title="Meal Period Analysis" subtitle="Revenue by time of day">
          {Object.entries(mealPeriods).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(mealPeriods)
                .sort(([, a], [, b]) => b.sales - a.sales)
                .map(([period, stats]) => {
                  const totalSales = Object.values(mealPeriods).reduce((s, p) => s + p.sales, 0)
                  const pct = totalSales > 0 ? (stats.sales / totalSales) * 100 : 0
                  return (
                    <div key={period}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${mealColors[period] || 'bg-gray-400'}`} />
                          <span className="text-sm font-medium text-gray-700">{period}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.sales)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${mealColors[period] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400">{stats.orders} orders</span>
                        <span className="text-[10px] text-gray-400">{pct.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="Select a period with orders" />
          )}
        </ReportCard>
      </div>

      {/* Detailed Table */}
      {data?.hours && data.hours.filter(h => h.orderCount > 0).length > 0 && (
        <ReportCard
          title="Detailed Hourly Breakdown"
          subtitle={`${data.hours.filter(h => h.orderCount > 0).length} active hours`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Hour</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Activity</th>
                </tr>
              </thead>
              <tbody>
                {data.hours.filter(h => h.orderCount > 0).map((h) => {
                  const period = getMealPeriod(h.hour)
                  const isPeak = peakHour && h.hour === peakHour.hour
                  return (
                    <tr key={h.hour} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isPeak ? 'bg-indigo-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${isPeak ? 'text-indigo-700' : 'text-gray-900'}`}>
                          {getHourLabel(h.hour)}
                        </span>
                        {isPeak && <span className="ml-1.5 text-[10px] text-indigo-600 font-medium">PEAK</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded ${mealColors[period] || 'bg-gray-400'}`} />
                          <span className="text-gray-600">{period}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{h.orderCount}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(h.totalSales)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{h.avgOrderValue.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPeak ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{ width: `${maxSales > 0 ? (h.totalSales / maxSales) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
