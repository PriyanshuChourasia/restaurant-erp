import { ArrowUp, ArrowDown, Minus, TrendingUp, BarChart3, Users, RefreshCw, Table, Percent, DollarSign } from 'lucide-react'
import { useKpiDashboard } from '../hooks/useReportQueries'
import { ReportPageHeader, LoadingSkeleton, formatCurrency, formatPercent } from '../components/ReportComponents'

export function ExecutiveKpiPage() {
  const { data, isLoading, isFetching, refetch } = useKpiDashboard()

  const kpis = data ? [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      subtitle: 'Last 30 days',
      icon: TrendingUp,
      color: 'emerald',
      change: data.vsLastPeriod,
    },
    {
      label: 'Gross Margin',
      value: formatPercent(data.grossMargin),
      subtitle: 'Profitability',
      icon: Percent,
      color: 'blue',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(data.netProfit),
      subtitle: 'After all costs',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Repeat Rate',
      value: formatPercent(data.repeatRate),
      subtitle: 'Returning customers',
      icon: Users,
      color: 'purple',
    },
    {
      label: 'Table Turnover',
      value: data.tableTurnover.toFixed(1),
      subtitle: 'Orders per table',
      icon: Table,
      color: 'indigo',
    },
    {
      label: 'Waste %',
      value: formatPercent(data.wastePercent),
      subtitle: 'Inventory loss',
      icon: BarChart3,
      color: 'red',
    },
  ] : []

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Executive KPI Dashboard"
        description="Top-level business metrics at a glance"
        icon={BarChart3}
        iconColor="bg-gray-900"
      >
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </ReportPageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={6} type="cards" />
      ) : data ? (
        <>
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kpis.map((kpi) => {
              const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
                emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-500', text: 'text-emerald-900' },
                blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-500', text: 'text-blue-900' },
                purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-500', text: 'text-purple-900' },
                indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-500', text: 'text-indigo-900' },
                red: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-500', text: 'text-red-900' },
                amber: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-500', text: 'text-amber-900' },
              }
              const c = colorMap[kpi.color] || colorMap.emerald
              return (
                <div key={kpi.label} className={`rounded-xl border ${c.border} bg-white p-6 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{kpi.subtitle}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg} text-white shadow-sm`}>
                      <kpi.icon size={20} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${c.text} tracking-tight`}>{kpi.value}</p>
                  {'change' in kpi && kpi.change !== undefined && (
                    <div className="flex items-center gap-1.5 mt-3">
                      {kpi.change > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <ArrowUp size={14} /> {Math.abs(kpi.change).toFixed(1)}%
                        </span>
                      ) : kpi.change < 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <ArrowDown size={14} /> {Math.abs(kpi.change).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Minus size={14} /> No change
                        </span>
                      )}
                      <span className="text-xs text-gray-400">vs last period</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quick Summary Row */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Health Indicators</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(data.grossMargin, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500">Gross Margin</span>
                <span className="text-sm font-semibold text-gray-900">{data.grossMargin.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(data.repeatRate, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500">Repeat Rate</span>
                <span className="text-sm font-semibold text-gray-900">{data.repeatRate.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(data.tableTurnover * 20, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500">Table Turnover</span>
                <span className="text-sm font-semibold text-gray-900">{data.tableTurnover.toFixed(1)}x</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(data.wastePercent, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500">Waste</span>
                <span className="text-sm font-semibold text-gray-900">{data.wastePercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <TrendingUp size={40} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No data available</h3>
          <p className="text-sm text-gray-500">Connect your business data to see KPIs.</p>
        </div>
      )}
    </div>
  )
}
