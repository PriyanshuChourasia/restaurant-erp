import { useState } from 'react'
import { FileText, IndianRupee, Receipt, Percent, Hash, Search } from 'lucide-react'
import { useInvoiceDrillDown } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, formatCurrency } from '../components/ReportComponents'

export function InvoiceDrillDownPage() {
  const [invoiceId, setInvoiceId] = useState('')
  const [searchedId, setSearchedId] = useState('')
  const { data, isLoading, isError } = useInvoiceDrillDown(searchedId)

  const handleSearch = () => {
    setSearchedId(invoiceId.trim())
  }

  const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success'
      case 'confirmed': return 'info'
      case 'draft': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Invoice Drill-Down"
        description="View complete invoice details with line-item and tax breakdown"
        icon={FileText}
        iconColor="bg-cyan-600"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Hash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter invoice ID..."
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-9 pl-8 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-gray-400 w-64"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!invoiceId.trim()}
            className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search size={16} />
          </button>
        </div>
      </ReportPageHeader>

      {!searchedId ? (
        <EmptyState
          icon={FileText}
          title="Search for an Invoice"
          description="Enter an invoice ID above to view its complete details including line items, tax breakdown, and totals."
        />
      ) : isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton type="cards" rows={4} />
          <LoadingSkeleton type="table" rows={5} />
        </div>
      ) : isError ? (
        <EmptyState icon={Search} title="Invoice Not Found" description={`No invoice found with ID "${searchedId}". Please check the ID and try again.`} />
      ) : data ? (
        <>
          {/* Invoice Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Invoice"
              value={data.invoiceNumber}
              subtitle={new Date(data.invoiceDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              icon={Hash}
              color="gray"
            />
            <KpiCard
              label="Status"
              value={data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              subtitle={`Payment: ${data.paymentMethod}`}
              icon={Receipt}
              color={data.status === 'cancelled' ? 'red' : data.status === 'completed' ? 'emerald' : 'amber'}
            />
            <KpiCard
              label="Grand Total"
              value={formatCurrency(data.grandTotal)}
              subtitle={`Subtotal: ${formatCurrency(data.subtotal)}`}
              icon={IndianRupee}
              color="emerald"
            />
            <KpiCard
              label="Tax Total"
              value={formatCurrency(data.taxTotal)}
              subtitle={`CGST: ${formatCurrency(data.cgstTotal)} · SGST: ${formatCurrency(data.sgstTotal)}`}
              icon={Percent}
              color="purple"
            />
          </div>

          {/* Customer & Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ReportCard title="Customer Details" noPadding>
              <div className="divide-y divide-gray-50">
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-medium text-gray-900">{data.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="text-sm font-medium text-gray-900">{data.customerPhone || '—'}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">GSTIN</span>
                  <span className="text-sm font-medium text-gray-900">{data.customerGstin || '—'}</span>
                </div>
              </div>
            </ReportCard>

            <ReportCard title="Payment & Status" noPadding>
              <div className="divide-y divide-gray-50">
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <StatusBadge status={data.paymentMethod} variant="info" />
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status={data.status} variant={statusVariant(data.status)} />
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">Round Off</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(data.roundOff)}</span>
                </div>
              </div>
            </ReportCard>

            {data.notes && (
              <ReportCard title="Notes" noPadding>
                <div className="px-5 py-3">
                  <p className="text-sm text-gray-700">{data.notes}</p>
                </div>
              </ReportCard>
            )}
          </div>

          {/* Line Items Table */}
          <ReportCard
            title="Line Items"
            subtitle={`${data.items.length} items`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">HSN</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Taxable</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">GST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">CGST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">SGST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-xs text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemName}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{item.hsnCode}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.taxableValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-medium text-gray-600">{item.gstRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.cgstAmount)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.sgstAmount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={3} className="py-3 px-4 text-gray-900">Totals</td>
                    <td className="py-3 px-4 text-right text-gray-900">{data.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td />
                    <td className="py-3 px-4 text-right">{formatCurrency(data.items.reduce((s, i) => s + i.taxableValue, 0))}</td>
                    <td />
                    <td className="py-3 px-4 text-right">{formatCurrency(data.items.reduce((s, i) => s + i.cgstAmount, 0))}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(data.items.reduce((s, i) => s + i.sgstAmount, 0))}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(data.items.reduce((s, i) => s + i.totalAmount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ReportCard>

          {/* Tax Summary */}
          {data.taxRateSummary.length > 0 && (
            <ReportCard title="Tax Rate Summary" subtitle={`${data.taxRateSummary.length} GST rates applied`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">CGST</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">SGST</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.taxRateSummary.map((t) => (
                      <tr key={t.rate} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">{t.rate}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(t.taxableValue)}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(t.cgst)}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(t.sgst)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(t.cgst + t.sgst)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportCard>
          )}

          {/* Total Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500 mb-1">Subtotal</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(data.subtotal)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500 mb-1">Discount</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(data.discount)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500 mb-1">Tax</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(data.taxTotal)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5">
              <p className="text-sm text-emerald-600 mb-1">Grand Total</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(data.grandTotal)}</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
