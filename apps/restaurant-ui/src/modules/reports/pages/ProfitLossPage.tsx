import { TrendingUp, TrendingDown } from 'lucide-react'
import { useProfitLoss } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function ProfitLossPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data, isLoading } = useProfitLoss(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Profit & Loss Statement"
        description="Revenue, costs, and profitability analysis"
        icon={data && data.netProfit >= 0 ? TrendingUp : TrendingDown}
        iconColor={data && data.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* P&L Statement */}
          <ReportCard title="Statement" className="lg:col-span-2">
            <div className="space-y-1">
              {/* Revenue Section */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Revenue</p>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Gross Sales</span>
                  <span className="font-medium text-gray-900">₹{data.revenue.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Less: Discounts</span>
                  <span className="text-red-600">-₹{data.revenue.discounts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Less: Cancelled</span>
                  <span className="text-red-600">-₹{data.revenue.cancelledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                  <span className="font-semibold text-gray-900">Net Revenue</span>
                  <span className="font-bold text-gray-900">₹{data.revenue.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* COGS Section */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cost of Goods Sold</p>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Purchases</span>
                  <span className="font-medium text-gray-900">₹{data.costOfGoodsSold.purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Less: Closing Inventory</span>
                  <span className="text-emerald-600">-₹{data.costOfGoodsSold.closingInventory.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                  <span className="font-semibold text-gray-900">COGS</span>
                  <span className="font-bold text-gray-900">₹{data.costOfGoodsSold.cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="flex justify-between text-sm py-2 border-b border-gray-100 mb-3">
                <span className="font-semibold text-gray-900">Gross Profit</span>
                <div className="text-right">
                  <span className={`font-bold ${data.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{data.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">({data.grossMargin.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Operating Expenses</p>
                {data.expensesByCategory.length > 0 ? data.expensesByCategory.map((e) => (
                  <div key={e.category} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 capitalize">{e.category}</span>
                    <span className="font-medium text-gray-900">₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">No expense entries in period</p>
                )}
                <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                  <span className="font-semibold text-gray-900">Total Expenses</span>
                  <span className="font-bold text-gray-900">₹{data.operatingExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="flex justify-between items-center py-3 bg-gray-50 -mx-5 px-5 rounded-lg">
                <span className="text-lg font-bold text-gray-900">Net Profit</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{data.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">Net Margin: {data.netMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </ReportCard>

          {/* Visual Summary */}
          <ReportCard title="Profitability">
            <div className="space-y-6">
              {/* Gross Margin Gauge */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Gross Margin</p>
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${data.grossMargin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(data.grossMargin), 100)}%` }}
                  />
                </div>
                <p className={`text-sm font-bold mt-1 ${data.grossMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {data.grossMargin.toFixed(1)}%
                </p>
              </div>

              {/* Net Margin Gauge */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Net Margin</p>
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${data.netMargin >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(data.netMargin), 100)}%` }}
                  />
                </div>
                <p className={`text-sm font-bold mt-1 ${data.netMargin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {data.netMargin.toFixed(1)}%
                </p>
              </div>

              {/* Revenue vs Cost Breakdown */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">Revenue vs Cost Split</p>
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {data.revenue.netRevenue > 0 && (
                    <>
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(data.grossProfit / data.revenue.netRevenue) * 100}%` }}
                        title={`Gross Profit: ${data.grossMargin.toFixed(1)}%`}
                      />
                      <div
                        className="bg-red-400"
                        style={{ width: `${(data.costOfGoodsSold.cogs / data.revenue.netRevenue) * 100}%` }}
                        title={`COGS: ${(100 - data.grossMargin).toFixed(1)}%`}
                      />
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-gray-600">Profit ({data.grossMargin.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span className="text-gray-600">COGS ({(100 - data.grossMargin).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </ReportCard>
        </div>
      ) : (
        <ReportCard title="No Data">
          <p className="text-sm text-gray-400 italic">No financial data available for the selected period</p>
        </ReportCard>
      )}
    </div>
  )
}
