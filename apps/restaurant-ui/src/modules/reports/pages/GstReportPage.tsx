import { FileText } from 'lucide-react'
import { useGstReport } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function GstReportPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data, isLoading } = useGstReport(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="GST Report"
        description="Tax collected by GST rate for filing"
        icon={FileText}
        iconColor="bg-purple-600"
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Taxable Value', value: `₹${Number(data?.totalTaxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Total CGST', value: `₹${Number(data?.totalCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Total SGST', value: `₹${Number(data?.totalSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Total Tax', value: `₹${Number(data?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
            <p className="text-lg font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GST Rate Breakdown */}
        <ReportCard title="GST Rate Summary" className="lg:col-span-2">
          {isLoading ? <LoadingSkeleton rows={5} /> : data?.gstRateSummary && data.gstRateSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">CGST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">SGST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gstRateSummary.map((g) => (
                    <tr key={g.rate} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{g.rate}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{g.itemCount}</td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{g.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{g.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-gray-700">₹{g.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{g.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">Total</td>
                    <td className="py-3 px-4 text-right text-gray-900">{data.itemCount}</td>
                    <td className="py-3 px-4 text-right text-gray-900">₹{data.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-900">₹{data.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-900">₹{data.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-900">₹{data.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No GST data for selected period</p>
          )}
        </ReportCard>

        {/* GST Distribution */}
        <ReportCard title="Tax Distribution">
          {data?.gstRateSummary && data.gstRateSummary.length > 0 ? (
            <div className="space-y-4">
              {data.gstRateSummary.map((g, i) => {
                const pct = data.totalTax > 0 ? (g.totalTax / data.totalTax) * 100 : 0
                const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
                return (
                  <div key={g.rate}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{g.rate} GST</span>
                      <span className="font-medium text-gray-900">₹{g.totalTax.toLocaleString('en-IN')} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-4 bg-gray-50 rounded overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}

              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoices</span>
                  <span className="font-medium text-gray-900">{data.invoiceCount}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Line Items</span>
                  <span className="font-medium text-gray-900">{data.itemCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No data</p>
          )}
        </ReportCard>
      </div>
    </div>
  )
}
