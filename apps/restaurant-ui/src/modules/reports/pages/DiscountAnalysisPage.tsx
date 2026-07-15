import { useState } from 'react'
import { Percent, Receipt, IndianRupee, TrendingDown, Search } from 'lucide-react'
import { useDiscountAnalysis } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, formatCurrency, formatPercent, HorizontalBarChart } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const paymentLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
  credit: 'Credit',
}

const paymentColors: Record<string, string> = {
  cash: 'bg-emerald-500',
  card: 'bg-blue-500',
  upi: 'bg-violet-500',
  online: 'bg-amber-500',
  credit: 'bg-red-500',
}

export function DiscountAnalysisPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useDiscountAnalysis(fromDate, toDate)

  const filteredInvoices = (data?.highDiscountInvoices ?? []).filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Discount Analysis"
        description="Discount patterns, rate analysis, and high-discount orders"
        icon={Percent}
        iconColor="bg-rose-600"
        badge={data?.totalInvoices ? { label: `${data.totalInvoices} invoices`, color: 'bg-rose-100 text-rose-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <LoadingSkeleton type="cards" rows={4} />
        ) : (
          <>
            <KpiCard
              label="Total Discount Given"
              value={formatCurrency(data?.totalDiscount ?? 0)}
              subtitle={`Across ${data?.totalInvoices ?? 0} invoices`}
              icon={IndianRupee}
              color="red"
            />
            <KpiCard
              label="Discount Rate"
              value={formatPercent(data?.discountRate ?? 0)}
              subtitle="% of subtotal"
              icon={Percent}
              color="amber"
            />
            <KpiCard
              label="Avg Discount / Invoice"
              value={formatCurrency(data?.avgDiscountPerInvoice ?? 0)}
              subtitle="Per invoice average"
              icon={TrendingDown}
              color="purple"
            />
            <KpiCard
              label="Invoices with Discount"
              value={String((data?.highDiscountInvoices ?? []).length > 0 ? data?.totalInvoices : 0)}
              subtitle={
                data
                  ? `${(data.totalInvoices - Math.round(data.totalInvoices * data.discountDistribution.noDiscount.percentage / 100))} invoices`
                  : ''
              }
              icon={Receipt}
              color="blue"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discount Distribution */}
        <ReportCard title="Discount Distribution" subtitle="By discount slab">
          {isLoading ? (
            <LoadingSkeleton type="chart" />
          ) : data?.discountDistribution ? (
            <div className="space-y-4">
              {Object.entries(data.discountDistribution).map(([key, value]) => {
                const labels: Record<string, string> = {
                  noDiscount: 'No Discount',
                  upTo5Percent: 'Up to 5%',
                  upTo10Percent: '5% to 10%',
                  above10Percent: 'Above 10%',
                }
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{labels[key] || key}</span>
                      <span className="text-gray-900 font-semibold">{value.count} ({value.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          key === 'noDiscount' ? 'bg-gray-300' :
                          key === 'upTo5Percent' ? 'bg-emerald-500' :
                          key === 'upTo10Percent' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Percent} title="No data" description="No discount data for this period" />
          )}
        </ReportCard>

        {/* By Payment Method */}
        <ReportCard title="Discount by Payment Method" subtitle="Total discount per channel">
          {data?.byPaymentMethod && data.byPaymentMethod.length > 0 ? (
            <HorizontalBarChart
              segments={data.byPaymentMethod.map(m => ({
                label: paymentLabels[m.method] || m.method,
                value: m.totalDiscount,
                color: paymentColors[m.method] || 'bg-gray-400',
                subLabel: `${m.count} invoices`,
              }))}
            />
          ) : (
            <EmptyState icon={Search} title="No data" description="No payment method data" />
          )}
        </ReportCard>
      </div>

      {/* High Discount Invoices Table */}
      <ReportCard
        title="High Discount Invoices"
        subtitle={data?.highDiscountInvoices?.length ? `${data.highDiscountInvoices.length} invoices with above-average discounts` : ''}
        action={
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-gray-400 w-48"
            />
          </div>
        }
      >
        {isLoading ? (
          <LoadingSkeleton type="table" rows={5} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState icon={Search} title="No results" description="No high-discount invoices found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-700">{inv.customerName}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">{formatCurrency(inv.discount)}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={`${inv.discountPercent.toFixed(1)}%`}
                        variant={inv.discountPercent > 10 ? 'danger' : inv.discountPercent > 5 ? 'warning' : 'info'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(inv.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>
    </div>
  )
}
