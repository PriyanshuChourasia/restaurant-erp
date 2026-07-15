import { TrendingUp, TrendingDown, DollarSign, Receipt, BarChart3 } from 'lucide-react'
import { useProfitLoss } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, ProgressBar, formatCurrency, SectionHeader } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function ProfitLossPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useProfitLoss(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Profit & Loss Statement"
        description="Revenue, costs, and profitability analysis"
        icon={data && data.netProfit >= 0 ? TrendingUp : TrendingDown}
        iconColor={data && data.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}
        badge={data ? {
          label: data.netProfit >= 0 ? 'Profitable' : 'Loss',
          color: data.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
        } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`rounded-xl border p-5 ${data.revenue.netRevenue >= 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-500">Net Revenue</span>
              </div>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(data.revenue.netRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">After discounts & cancellations</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-500">Gross Profit</span>
              </div>
              <p className={`text-xl font-bold ${data.grossProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatCurrency(data.grossProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">Margin: {data.grossMargin.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-gray-500">Operating Expenses</span>
              </div>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(data.operatingExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">{data.expensesByCategory.length} categories</p>
            </div>
            <div className={`rounded-xl border p-5 ${data.netProfit >= 0 ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white' : 'border-red-300 bg-gradient-to-br from-red-50 to-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                {data.netProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-red-500" />}
                <span className="text-sm font-medium text-gray-500">Net Profit</span>
              </div>
              <p className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>{formatCurrency(data.netProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">Margin: {data.netMargin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* P&L Statement - takes 2 cols */}
            <ReportCard title="Statement" subtitle="Complete P&L breakdown" className="lg:col-span-2">
              <div className="space-y-1">
                {/* Revenue Section */}
                <div className="pb-4 mb-4 border-b border-gray-100">
                  <SectionHeader title="Revenue" subtitle="Sales income" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Gross Sales</span>
                      <span className="font-medium text-gray-900">{formatCurrency(data.revenue.grossSales)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Less: Discounts</span>
                      <span className="text-red-600 font-medium">-{formatCurrency(data.revenue.discounts)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Less: Cancelled Orders</span>
                      <span className="text-red-600 font-medium">-{formatCurrency(data.revenue.cancelledAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                      <span className="font-semibold text-gray-900">Net Revenue</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(data.revenue.netRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* COGS Section */}
                <div className="pb-4 mb-4 border-b border-gray-100">
                  <SectionHeader title="Cost of Goods Sold" subtitle="Direct costs" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Purchases</span>
                      <span className="font-medium text-gray-900">{formatCurrency(data.costOfGoodsSold.purchases)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Less: Closing Inventory</span>
                      <span className="text-emerald-600 font-medium">-{formatCurrency(data.costOfGoodsSold.closingInventory)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                      <span className="font-semibold text-gray-900">COGS</span>
                      <span className="font-bold text-gray-900">{formatCurrency(data.costOfGoodsSold.cogs)}</span>
                    </div>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between items-center text-sm py-3 border-b border-gray-100 mb-4">
                  <span className="font-semibold text-gray-900">Gross Profit</span>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${data.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(data.grossProfit)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">({data.grossMargin.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="pb-4 mb-4 border-b border-gray-100">
                  <SectionHeader title="Operating Expenses" subtitle="Indirect costs" />
                  <div className="space-y-2">
                    {data.expensesByCategory.length > 0 ? data.expensesByCategory.map((e) => {
                      const pctOfRevenue = data.revenue.netRevenue > 0 ? (e.amount / data.revenue.netRevenue) * 100 : 0
                      return (
                        <div key={e.category} className="flex items-center justify-between text-sm py-1.5 hover:bg-gray-50 rounded px-2 -mx-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 capitalize">{e.category}</span>
                            <span className="text-[10px] text-gray-400">{pctOfRevenue.toFixed(1)}% of revenue</span>
                          </div>
                          <span className="font-medium text-gray-900">{formatCurrency(e.amount)}</span>
                        </div>
                      )
                    }) : (
                      <p className="text-xs text-gray-400 italic py-2">No expense entries in period</p>
                    )}
                    <div className="flex justify-between text-sm py-2 border-t border-gray-100 mt-1">
                      <span className="font-semibold text-gray-900">Total Expenses</span>
                      <span className="font-bold text-amber-700">{formatCurrency(data.operatingExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`flex justify-between items-center py-4 px-5 rounded-xl -mx-5 ${data.netProfit >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {data.netProfit >= 0 ? <TrendingUp size={22} className="text-emerald-600" /> : <TrendingDown size={22} className="text-red-600" />}
                    <div>
                      <span className="text-lg font-bold text-gray-900">Net Profit</span>
                      <p className="text-xs text-gray-500">Net Margin: {data.netMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(data.netProfit)}
                  </span>
                </div>
              </div>
            </ReportCard>

            {/* Visual Summary */}
            <ReportCard title="Profitability Analysis" subtitle="Visual breakdown">
              <div className="space-y-6">
                {/* Gross Margin Gauge */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Gross Margin</p>
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${data.grossMargin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
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
                      className={`h-full rounded-full transition-all ${data.netMargin >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(data.netMargin), 100)}%` }}
                    />
                  </div>
                  <p className={`text-sm font-bold mt-1 ${data.netMargin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {data.netMargin.toFixed(1)}%
                  </p>
                </div>

                {/* Revenue vs Cost Breakdown */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">Revenue Waterfall</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Gross Sales', value: data.revenue.grossSales, color: 'bg-emerald-500' },
                      { label: 'Discounts', value: -data.revenue.discounts, color: 'bg-red-400' },
                      { label: 'Cancelled', value: -data.revenue.cancelledAmount, color: 'bg-red-300' },
                      { label: 'COGS', value: -data.costOfGoodsSold.cogs, color: 'bg-amber-500' },
                      { label: 'Expenses', value: -data.operatingExpenses, color: 'bg-orange-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded ${item.color}`} />
                        <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                        <span className={`text-xs font-medium ${item.value >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {item.value >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.value))}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded ${data.netProfit >= 0 ? 'bg-emerald-700' : 'bg-red-700'}`} />
                      <span className="text-xs font-semibold text-gray-900 flex-1">Net Profit</span>
                      <span className={`text-xs font-bold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(data.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                {data.expensesByCategory.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-3">Expense Split</p>
                    <div className="space-y-2">
                      {data.expensesByCategory.map((e) => {
                        return (
                          <ProgressBar
                            key={e.category}
                            value={e.amount}
                            max={data.operatingExpenses}
                            color="bg-amber-500"
                            height="h-1.5"
                            label={e.category}
                            showLabel
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ReportCard>
          </div>
        </>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No financial data"
          description="No transactions found for the selected period"
        />
      )}
    </div>
  )
}
