import { useState } from 'react'
import { TrendingUp, Receipt, IndianRupee, BarChart3 } from 'lucide-react'
import { useSalesTrends } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton, EmptyState, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function TrendAnalysisPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const [groupBy, setGroupBy] = useState<'week' | 'month'>('week')
  const { data, isLoading } = useSalesTrends(fromDate, toDate, groupBy)

  const periods = data?.periods ?? []
  const bestPeriod = periods.length > 0
    ? periods.reduce((max, p) => p.revenue > max.revenue ? p : max, periods[0])
    : null
  const worstDecline = periods.length > 1
    ? periods.reduce((min, p) => (p.change !== null && p.change < (min.change ?? 0)) ? p : min, periods[0])
    : null

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales Trend Analysis"
        description={`${groupBy === 'week' ? 'Weekly' : 'Monthly'} revenue patterns and period-over-period changes`}
        icon={TrendingUp}
        iconColor="bg-indigo-600"
        badge={data?.periods?.length ? { label: `${data.periods.length} periods`, color: 'bg-indigo-100 text-indigo-700' } : undefined}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setGroupBy('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${groupBy === 'week' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGroupBy('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${groupBy === 'month' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Monthly
            </button>
          </div>
          <DateRangeFilter
            value={{ fromDate, toDate }}
            onChange={setCustom}
            activePreset={preset}
            onPresetChange={setPreset}
          />
        </div>
      </ReportPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <LoadingSkeleton type="cards" rows={4} />
        ) : (
          <>
            <KpiCard
              label="Total Revenue"
              value={formatCurrency(data?.totalRevenue ?? 0)}
              subtitle={`Across ${periods.length} periods`}
              icon={IndianRupee}
              color="emerald"
            />
            <KpiCard
              label="Total Orders"
              value={String(data?.totalInvoices ?? 0)}
              subtitle={`${groupBy === 'week' ? 'Weekly' : 'Monthly'} average: ${periods.length > 0 ? Math.round((data?.totalInvoices ?? 0) / periods.length) : 0}`}
              icon={Receipt}
              color="blue"
            />
            <KpiCard
              label="Avg Order Value"
              value={formatCurrency(periods.length > 0 ? periods.reduce((s, p) => s + p.avgOrderValue, 0) / periods.length : 0)}
              subtitle="Period average"
              icon={BarChart3}
              color="purple"
            />
            <KpiCard
              label="Best Period"
              value={bestPeriod?.periodLabel ?? 'N/A'}
              subtitle={bestPeriod ? formatCurrency(bestPeriod.revenue) : ''}
              icon={TrendingUp}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Trends Table */}
      <ReportCard
        title="Period-over-Period Trends"
        subtitle={data ? `${periods.length} periods · Total: ${formatCurrency(data.totalRevenue)}` : ''}
      >
        {isLoading ? (
          <LoadingSkeleton type="table" rows={5} />
        ) : periods.length === 0 ? (
          <EmptyState icon={BarChart3} title="No trend data" description="No sales data for the selected period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Discounts</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.periodStart} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{p.periodLabel}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{p.invoiceCount}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(p.revenue)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(p.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(p.discounts)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(p.tax)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(p.avgOrderValue)}</td>
                    <td className="py-3 px-4 text-right">
                      {p.change !== null ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.change >= 0 ? '↑' : '↓'} {Math.abs(p.change).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>

      {/* Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bestPeriod && (
          <ReportCard title="Best Performing Period" subtitle="Highest revenue">
            <div className="p-2">
              <p className="text-lg font-bold text-emerald-900">{bestPeriod.periodLabel}</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(bestPeriod.revenue)}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-bold text-gray-900">{bestPeriod.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Order</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(bestPeriod.avgOrderValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Discounts</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(bestPeriod.discounts)}</p>
                </div>
              </div>
            </div>
          </ReportCard>
        )}
        {worstDecline && worstDecline.change !== null && worstDecline.change < 0 && (
          <ReportCard title="Largest Decline" subtitle={`${worstDecline.periodLabel} — ↓ ${Math.abs(worstDecline.change).toFixed(1)}%`}>
            <div className="p-2">
              <p className="text-lg font-bold text-red-900">{worstDecline.periodLabel}</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(worstDecline.revenue)}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-bold text-gray-900">{worstDecline.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Order</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(worstDecline.avgOrderValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Discounts</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(worstDecline.discounts)}</p>
                </div>
              </div>
            </div>
          </ReportCard>
        )}
      </div>
    </div>
  )
}
