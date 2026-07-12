import { CreditCard } from 'lucide-react'
import { useSalesByPaymentMethod } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard } from '../components/ReportComponents'
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

export function PaymentMethodPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data, isLoading } = useSalesByPaymentMethod(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales by Payment Method"
        description="Revenue breakdown across payment channels"
        icon={CreditCard}
        iconColor="bg-blue-600"
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-16 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-24" />
            </div>
          ))
        ) : data?.methods.map((m) => (
          <div key={m.method} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${methodColors[m.method] || 'bg-gray-400'}`} />
              <span className="text-sm font-medium text-gray-500">{methodLabels[m.method] || m.method}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">₹{m.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400 mt-1">{m.count} orders ({m.percentage.toFixed(1)}%)</p>
          </div>
        ))}
      </div>

      {/* Distribution Bar */}
      {data && data.methods.length > 0 && (
        <ReportCard title="Revenue Distribution">
          <div className="h-8 rounded-lg overflow-hidden flex bg-gray-50">
            {data.methods.map((m) => (
              <div
                key={m.method}
                className={`${methodColors[m.method] || 'bg-gray-400'} transition-all hover:opacity-90`}
                style={{ width: `${m.percentage}%` }}
                title={`${methodLabels[m.method] || m.method}: ₹${m.total.toLocaleString('en-IN')} (${m.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {data.methods.map((m) => (
              <div key={m.method} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${methodColors[m.method] || 'bg-gray-400'}`} />
                <span className="text-xs text-gray-600">{methodLabels[m.method] || m.method}: {m.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {/* Detail Table */}
      {data && (
        <ReportCard title="Detailed Breakdown">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.methods.map((m) => (
                  <tr key={m.method} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{methodLabels[m.method] || m.method}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{m.count}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">₹{m.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-700">₹{m.average.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{m.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">{data.methods.reduce((s, m) => s + m.count, 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">₹{data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{data.methods.reduce((s, m) => s + m.count, 0) > 0
                      ? (data.grandTotal / data.methods.reduce((s, m) => s + m.count, 0)).toFixed(2)
                      : '0.00'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
