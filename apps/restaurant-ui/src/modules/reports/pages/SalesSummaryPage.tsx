import { DollarSign } from 'lucide-react'
import { useDailySalesSummary, useSalesReport } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton } from '../components/ReportComponents'
import { DateRangeFilter, useDateRange } from '../components/DateRangeFilter'

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
  credit: 'Credit',
}

export function SalesSummaryPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data: summary, isLoading: summaryLoading } = useSalesReport(fromDate, toDate)
  const { data: daily, isLoading: dailyLoading } = useDailySalesSummary()

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Sales Summary"
        description="Revenue, orders, and performance overview"
        icon={DollarSign}
        iconColor="bg-emerald-600"
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={`₹${Number(summary?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="gross sales"
          color="emerald"
        />
        <KpiCard
          label="Total Orders"
          value={String(summary?.invoiceCount || 0)}
          subtitle="invoices processed"
          color="blue"
        />
        <KpiCard
          label="Avg Order Value"
          value={`₹${Number(summary?.averageOrderValue || 0).toFixed(2)}`}
          subtitle="per order"
          color="indigo"
        />
        <KpiCard
          label="Total Tax"
          value={`₹${Number(summary?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="GST collected"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <ReportCard title="Daily Trend">
          {summaryLoading ? <LoadingSkeleton rows={5} /> : summary?.dailyTrend && summary.dailyTrend.length > 0 ? (
            <div className="space-y-2">
              {summary.dailyTrend.slice(-14).map((d) => {
                const maxSales = Math.max(...summary.dailyTrend.map(x => x.totalSales))
                const width = maxSales > 0 ? (d.totalSales / maxSales) * 100 : 0
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right">₹{d.totalSales.toLocaleString('en-IN')}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No sales data for selected period</p>
          )}
        </ReportCard>

        {/* Today's Summary */}
        <ReportCard title="Today's Summary">
          {dailyLoading ? <LoadingSkeleton rows={4} /> : daily ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Orders Today</span>
                <span className="font-semibold text-gray-900">{daily.orderCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Revenue Today</span>
                <span className="font-semibold text-gray-900">₹{daily.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax Collected</span>
                <span className="font-semibold text-gray-900">₹{Number(daily.totalTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg Order Value</span>
                <span className="font-semibold text-gray-900">₹{Number(daily.averageOrderValue).toFixed(2)}</span>
              </div>
              {daily.paymentBreakdown.length > 0 && (
                <>
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">By Payment Method</p>
                    {daily.paymentBreakdown.map((p) => (
                      <div key={p.method} className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">{methodLabels[p.method] || p.method}</span>
                        <span className="font-medium text-gray-700">₹{p.total.toLocaleString('en-IN')} ({p.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No data for today</p>
          )}
        </ReportCard>

        {/* Summary Stats */}
        <ReportCard title="Period Statistics" className="lg:col-span-2">
          {summaryLoading ? <LoadingSkeleton rows={3} /> : summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalSubtotal.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Subtotal (pre-tax)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalDiscount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Total Discounts</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">₹{summary.minOrder.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Min Order Value</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">₹{summary.maxOrder.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Max Order Value</p>
              </div>
            </div>
          ) : null}
        </ReportCard>
      </div>
    </div>
  )
}
