import { useState } from 'react'
import { XCircle, IndianRupee, TrendingDown, AlertTriangle, Search } from 'lucide-react'
import { useCancelledTransactions } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, formatCurrency, formatPercent, ProgressBar } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function CancelledTransactionsPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useCancelledTransactions(fromDate, toDate)

  const filteredInvoices = (data?.invoices ?? []).filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Cancelled & Voided Transactions"
        description="Lost revenue analysis and cancellation tracking"
        icon={XCircle}
        iconColor="bg-red-600"
        badge={data?.cancelledCount ? { label: `${data.cancelledCount} cancelled`, color: 'bg-red-100 text-red-700' } : undefined}
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
              label="Cancelled Orders"
              value={String(data?.cancelledCount ?? 0)}
              subtitle={`Out of ${data?.totalInvoices ?? 0} total invoices`}
              icon={XCircle}
              color="red"
            />
            <KpiCard
              label="Cancel Rate"
              value={formatPercent(data?.cancelRate ?? 0)}
              subtitle="% of total orders cancelled"
              icon={TrendingDown}
              color="amber"
            />
            <KpiCard
              label="Lost Revenue"
              value={formatCurrency(data?.lostRevenue ?? 0)}
              subtitle={`Avg loss: ${formatCurrency(data?.avgLostPerInvoice ?? 0)} per cancellation`}
              icon={IndianRupee}
              color="red"
            />
            <KpiCard
              label="Potential Saved"
              value={formatCurrency((data?.avgLostPerInvoice ?? 0) * ((data?.cancelledCount ?? 0) > 0 ? 1 : 0))}
              subtitle="If cancel rate halved"
              icon={AlertTriangle}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Cancel Rate Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title="Cancel Rate" subtitle="Cancelled vs completed">
          {isLoading ? (
            <LoadingSkeleton type="chart" />
          ) : data ? (
            <div className="space-y-4">
              <ProgressBar
                value={data.cancelledCount}
                max={data.totalInvoices}
                color="bg-red-500"
                height="h-4"
                showLabel
                label={`${data.cancelledCount} cancelled of ${data.totalInvoices} total`}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{data.totalInvoices - data.cancelledCount}</p>
                  <p className="text-xs text-emerald-600 mt-1">Completed</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{data.cancelledCount}</p>
                  <p className="text-xs text-red-600 mt-1">Cancelled</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={XCircle} title="No data" description="No cancellation data for this period" />
          )}
        </ReportCard>

        <ReportCard title="Revenue Impact" subtitle="Lost revenue breakdown">
          {isLoading ? (
            <LoadingSkeleton type="chart" />
          ) : data ? (
            <div className="space-y-4">
              <ProgressBar
                value={data.lostRevenue}
                max={data.lostRevenue * 3}
                color="bg-red-500"
                height="h-4"
                showLabel
                label={`Lost: ${formatCurrency(data.lostRevenue)}`}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(data.lostRevenue)}</p>
                  <p className="text-xs text-red-600 mt-1">Total Lost</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{formatCurrency(data.avgLostPerInvoice)}</p>
                  <p className="text-xs text-amber-600 mt-1">Avg per Cancellation</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={TrendingDown} title="No data" description="No revenue impact data" />
          )}
        </ReportCard>
      </div>

      {/* Cancelled Invoices Table */}
      <ReportCard
        title="Cancelled Invoices"
        subtitle={data?.invoices?.length ? `${data.invoices.length} invoices` : ''}
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
          <EmptyState icon={Search} title="No results" description="No cancelled invoices found for this period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Lost Revenue</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-700">{inv.customerName}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.paymentMethod} variant="info" />
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(inv.discount)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[150px] truncate">{inv.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-red-50 border-t-2 border-gray-200">
                  <td colSpan={6} className="py-3 px-4 text-gray-900">Total Lost Revenue</td>
                  <td className="py-3 px-4 text-right text-red-700">{formatCurrency(data?.lostRevenue ?? 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ReportCard>
    </div>
  )
}
