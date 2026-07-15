import { FileText, Receipt, BarChart3, Calculator, IndianRupee, ScrollText, TrendingDown, ArrowLeftRight, AlertTriangle, CircleCheck, Info } from 'lucide-react'
import { useGstReport, useGstReturn, useTaxSummary } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, formatCurrency, HorizontalBarChart, KpiCard, SectionHeader } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

const rateColors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

export function GstReportPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')

  const { data: salesGst, isLoading: loadingSales } = useGstReport(fromDate, toDate)
  const { data: gstReturn, isLoading: loadingReturn } = useGstReturn(fromDate, toDate)
  const { data: taxSummary, isLoading: loadingTax } = useTaxSummary(fromDate, toDate)

  const isLoading = loadingSales || loadingReturn || loadingTax
  const invoiceCount = salesGst?.invoiceCount || 0

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="GST Report"
        description="Comprehensive GST analysis — rate breakdown, tax summary, return filing data"
        icon={FileText}
        iconColor="bg-purple-600"
        badge={invoiceCount > 0 ? { label: `${invoiceCount} invoices`, color: 'bg-purple-100 text-purple-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={6} type="cards" />
      ) : (
        <>
          {/* Section 1: High-Level KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              label="GST Collected"
              value={formatCurrency(gstReturn?.totalGstCollected || 0)}
              subtitle={`${salesGst?.itemCount || 0} items taxed`}
              icon={IndianRupee}
              color="purple"
            />
            <KpiCard
              label="ITC Claimed"
              value={formatCurrency(gstReturn?.totalItc || 0)}
              subtitle="Input tax credit"
              icon={ArrowLeftRight}
              color="blue"
            />
            <KpiCard
              label="Net Payable"
              value={formatCurrency(gstReturn?.netPayable || 0)}
              subtitle={gstReturn ? `Collected - ITC` : ''}
              icon={Calculator}
              color="red"
            />
            <KpiCard
              label="Total Taxable"
              value={formatCurrency(salesGst?.totalTaxable || 0)}
              subtitle="Value before tax"
              icon={BarChart3}
              color="amber"
            />
            <KpiCard
              label="Effective Rate"
              value={`${salesGst && salesGst.totalTaxable > 0 ? ((salesGst.totalTax / salesGst.totalTaxable) * 100).toFixed(2) : '0.00'}%`}
              subtitle="Tax ÷ Taxable Value"
              icon={TrendingDown}
              color="indigo"
            />
            <KpiCard
              label="Invoice Count"
              value={String(invoiceCount)}
              subtitle={`${salesGst?.gstRateSummary?.length || 0} rate slabs`}
              icon={Receipt}
              color="emerald"
            />
          </div>

          {/* Section 2: GST Rate Breakdown Table + Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ReportCard title="GST Rate Summary" subtitle="Tax breakdown by rate slab" className="lg:col-span-2">
              {!salesGst?.gstRateSummary || salesGst.gstRateSummary.length === 0 ? (
                <EmptyState icon={FileText} title="No GST data" description="No transactions found for the selected period" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Invoices</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">CGST</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">SGST</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesGst.gstRateSummary.map((g, i) => {
                        const taxShare = salesGst.totalTax > 0 ? (g.totalTax / salesGst.totalTax) * 100 : 0
                        return (
                          <tr key={g.rate} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded ${rateColors[i % rateColors.length]}`} />
                                <span className="font-semibold text-gray-900">{g.rate}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700">{g.itemCount}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{g.invoiceCount}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(g.taxableValue)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(g.cgst)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(g.sgst)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(g.totalTax)}</td>
                            <td className="py-3 px-4">
                              <StatusBadge status={`${taxShare.toFixed(1)}%`} variant={taxShare > 30 ? 'success' : taxShare > 15 ? 'info' : 'neutral'} />
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                        <td className="py-3 px-4 text-gray-900">Total</td>
                        <td className="py-3 px-4 text-right text-gray-900">{salesGst.itemCount}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{salesGst.invoiceCount}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(salesGst.totalTaxable)}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(salesGst.totalCgst)}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(salesGst.totalSgst)}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(salesGst.totalTax)}</td>
                        <td className="py-3 px-4 text-right text-gray-900">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>

            <div className="space-y-6">
              {/* Tax Distribution */}
              <ReportCard title="Tax Distribution" subtitle="By GST rate slab">
                {salesGst?.gstRateSummary && salesGst.gstRateSummary.length > 0 ? (
                  <div className="space-y-4">
                    <HorizontalBarChart
                      segments={salesGst.gstRateSummary.map((g, i) => ({
                        label: g.rate,
                        value: g.totalTax,
                        color: rateColors[i % rateColors.length],
                      }))}
                      height="h-10"
                    />
                    <div className="space-y-2">
                      {salesGst.gstRateSummary.map((g, i) => {
                        return (
                          <div key={g.rate} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded ${rateColors[i % rateColors.length]}`} />
                              <span className="text-sm font-medium text-gray-700">{g.rate}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{g.itemCount} items</span>
                              <span className="font-medium text-gray-900">{formatCurrency(g.totalTax)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={BarChart3} title="No data" description="Select a period with transactions" />
                )}
              </ReportCard>
            </div>
          </div>

          {/* Section 3: Tax Summary & ITC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tax Type Breakdown */}
            <ReportCard title="Tax Type Summary" subtitle="CGST, SGST, IGST collected">
              {!taxSummary ? (
                <EmptyState icon={ScrollText} title="No data" description="No tax data for this period" />
              ) : (
                <div className="space-y-4">
                  <HorizontalBarChart
                    segments={[
                      { label: 'CGST', value: taxSummary.cgstCollected, color: 'bg-blue-500' },
                      { label: 'SGST', value: taxSummary.sgstCollected, color: 'bg-emerald-500' },
                      { label: 'IGST', value: taxSummary.igstCollected, color: 'bg-amber-500' },
                    ]}
                    height="h-8"
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Tax Type</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Collected</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">ITC</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Net Liability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxSummary.items.map((item) => (
                          <tr key={item.taxType} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-medium text-gray-900">{item.taxType}</td>
                            <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.collected)}</td>
                            <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.paid)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatCurrency(item.netLiability)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                          <td className="py-2 px-3 text-gray-900">Total</td>
                          <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(taxSummary.totalTaxCollected)}</td>
                          <td className="py-2 px-3 text-right text-gray-900">₹0.00</td>
                          <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(taxSummary.netGstLiability)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </ReportCard>

            {/* GSTR-3B Summary */}
            <ReportCard title="GSTR-3B Filing Summary" subtitle="Simplified return view">
              {!gstReturn ? (
                <EmptyState icon={FileText} title="No data" description="No return data for this period" />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CircleCheck size={14} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Total GST Collected</span>
                      </div>
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(gstReturn.totalGstCollected)}</p>
                      <p className="text-xs text-purple-600 mt-1">Output tax liability (Table 4)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowLeftRight size={14} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">ITC Available</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(gstReturn.totalItc)}</p>
                      <p className="text-xs text-blue-600 mt-1">Input Tax Credit (Table 6)</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="text-sm font-semibold text-red-900">Net GST Payable</span>
                      </div>
                      <StatusBadge
                        status={gstReturn.netPayable > 0 ? 'Payable' : 'Nil Return'}
                        variant={gstReturn.netPayable > 0 ? 'danger' : 'success'}
                      />
                    </div>
                    <p className="text-3xl font-bold text-red-900">{formatCurrency(gstReturn.netPayable)}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {gstReturn.netPayable > 0
                        ? `Due: ${gstReturn.netPayable > 50000 ? '20th of next month' : 'Quarterly'}`
                        : 'No payment due'}
                    </p>
                  </div>

                  {gstReturn.items.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <SectionHeader title="Rate-wise Breakdown" subtitle="Taxable value & tax by slab" />
                      <div className="space-y-2 mt-2">
                        {gstReturn.items.map((item) => (
                          <div key={item.rate} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{item.rate}</span>
                              <span className="text-xs text-gray-400">Taxable: {formatCurrency(item.taxableValue)}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalTax)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ReportCard>
          </div>

          {/* Section 4: Comparison Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase">Tax Collected vs Taxable</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {salesGst && salesGst.totalTaxable > 0
                  ? `${((salesGst.totalTax / salesGst.totalTaxable) * 100).toFixed(2)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">Effective tax rate on all billed items</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase">CGST + SGST</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency((salesGst?.totalCgst || 0) + (salesGst?.totalSgst || 0))}
              </p>
              <p className="text-xs text-gray-400">Combined central + state GST</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase">Avg Tax Per Invoice</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {invoiceCount > 0 ? formatCurrency((salesGst?.totalTax || 0) / invoiceCount) : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">Average GST per invoice</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
