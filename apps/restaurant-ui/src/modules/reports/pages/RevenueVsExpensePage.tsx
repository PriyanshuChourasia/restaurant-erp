import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, DollarSign } from 'lucide-react'
import { useRevenueVsExpense } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function RevenueVsExpensePage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useRevenueVsExpense(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Revenue vs Expense Comparison"
        description="Monthly revenue and expense trends"
        icon={TrendingUp}
        iconColor="bg-teal-600"
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Total Revenue</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            {isLoading ? '...' : formatCurrency(data?.totalRevenue ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Total Expenses</span>
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-900">
            {isLoading ? '...' : formatCurrency(data?.totalExpenses ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Net Income</span>
            <DollarSign size={18} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${(data?.netIncome ?? 0) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
            {isLoading ? '...' : formatCurrency(data?.netIncome ?? 0)}
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <ReportCard
        title="Monthly Comparison"
        subtitle={fromDate && toDate ? `${fromDate} to ${toDate}` : ''}
      >
        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Expenses</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Net Income</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const income = item.revenue - item.expenses
                  return (
                    <tr key={item.period} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.period}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(item.revenue)}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(item.expenses)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${income >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(income)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {income > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <ArrowUp size={13} /> Profitable
                          </span>
                        ) : income < 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <ArrowDown size={13} /> Loss
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Minus size={13} /> Break-even
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={TrendingUp} title="No data" description="No revenue or expense data for this period." />
        )}
      </ReportCard>

      {/* Quick Visual: Revenue vs Expense Bars */}
      {data?.items && data.items.length > 0 && (
        <ReportCard title="Revenue vs Expense Overview" subtitle="Period-by-period comparison">
          <div className="space-y-4">
            {data.items.map((item) => {
              const maxVal = Math.max(item.revenue, item.expenses, 1)
              return (
                <div key={item.period} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{item.period}</span>
                    <span className="text-gray-400">
                      {formatCurrency(item.revenue - item.expenses)}
                    </span>
                  </div>
                  <div className="flex gap-0.5 h-6">
                    <div
                      className="bg-emerald-500 rounded-l"
                      style={{ width: `${(item.revenue / maxVal) * 50}%` }}
                      title={`Revenue: ${formatCurrency(item.revenue)}`}
                    />
                    <div
                      className="bg-red-500 rounded-r"
                      style={{ width: `${(item.expenses / maxVal) * 50}%` }}
                      title={`Expenses: ${formatCurrency(item.expenses)}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </ReportCard>
      )}
    </div>
  )
}
