import { CreditCard, TrendingUp, Receipt, BarChart3 } from 'lucide-react'
import { useSalesByPaymentMethod } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, HorizontalBarChart, StatusBadge, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const methodColors: Record<string, string> = {
  cash: 'bg-emerald-500',
  card: 'bg-blue-500',
  upi: 'bg-violet-500',
  online: 'bg-amber-500',
  credit: 'bg-red-500',
}

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
  credit: 'Credit',
}

const methodIcons: Record<string, string> = {
  cash: '💵',
  card: '💳',
  upi: '📱',
  online: '🌐',
  credit: '📋',
}

export function PaymentMethodPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useSalesByPaymentMethod(fromDate, toDate)

  const topMethod = data?.methods?.length
    ? data.methods.reduce((max, m) => m.total > max.total ? m : max, data.methods[0])
    : null

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales by Payment Method"
        description="Revenue breakdown across payment channels"
        icon={CreditCard}
        iconColor="bg-blue-600"
        badge={data?.methods?.length ? { label: `${data.methods.length} methods`, color: 'bg-blue-100 text-blue-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* Method KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <LoadingSkeleton type="cards" rows={5} />
        ) : data?.methods.map((m) => (
          <div key={m.method} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${methodColors[m.method] || 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">{methodLabels[m.method] || m.method}</span>
              </div>
              <span className="text-lg">{methodIcons[m.method] || '💰'}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(m.total)}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{m.count} orders</span>
              <span className="text-xs font-medium text-gray-700">{m.percentage.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${methodColors[m.method] || 'bg-gray-400'}`}
                style={{ width: `${m.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Top Method Highlight */}
      {topMethod && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Top Payment Method</p>
              <p className="text-lg font-bold text-blue-900">
                {methodLabels[topMethod.method] || topMethod.method} — {formatCurrency(topMethod.total)} ({topMethod.percentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution Bar */}
        <ReportCard title="Revenue Distribution" subtitle="Visual breakdown">
          {data?.methods && data.methods.length > 0 ? (
            <HorizontalBarChart
              segments={data.methods.map(m => ({
                label: methodLabels[m.method] || m.method,
                value: m.total,
                color: methodColors[m.method] || 'bg-gray-400',
              }))}
            />
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="No payment data for this period" />
          )}
        </ReportCard>

        {/* Order Count Distribution */}
        <ReportCard title="Order Count Distribution" subtitle="By payment channel">
          {data?.methods && data.methods.length > 0 ? (
            <HorizontalBarChart
              segments={data.methods.map(m => ({
                label: methodLabels[m.method] || m.method,
                value: m.count,
                color: methodColors[m.method] || 'bg-gray-400',
              }))}
              height="h-8"
            />
          ) : (
            <EmptyState icon={Receipt} title="No orders" description="No orders for this period" />
          )}
        </ReportCard>
      </div>

      {/* Detailed Table */}
      {data && data.methods.length > 0 && (
        <ReportCard
          title="Detailed Breakdown"
          subtitle={`${data.methods.length} payment methods · Total: ${formatCurrency(data.grandTotal)}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Share</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Visual</th>
                </tr>
              </thead>
              <tbody>
                {data.methods.map((m) => (
                  <tr key={m.method} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${methodColors[m.method] || 'bg-gray-400'}`} />
                        <span className="font-medium text-gray-900">{methodLabels[m.method] || m.method}</span>
                        <span className="text-xs text-gray-400">{methodIcons[m.method]}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 font-medium">{m.count}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(m.total)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">₹{m.average.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge
                        status={`${m.percentage.toFixed(1)}%`}
                        variant={m.percentage > 30 ? 'success' : m.percentage > 15 ? 'info' : 'neutral'}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${methodColors[m.method] || 'bg-gray-400'}`}
                          style={{ width: `${m.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">{data.methods.reduce((s, m) => s + m.count, 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(data.grandTotal)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{data.methods.reduce((s, m) => s + m.count, 0) > 0
                      ? (data.grandTotal / data.methods.reduce((s, m) => s + m.count, 0)).toFixed(2)
                      : '0.00'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">100%</td>
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
