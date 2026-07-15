import { useMemo } from 'react'
import {
  DollarSign, TrendingUp, ShoppingCart, Receipt, BarChart3, ArrowUp, ArrowDown,
  Minus, Percent, CalendarDays, Sun, Sunrise,
} from 'lucide-react'
import { useSalesReport, useDailySalesSummary } from '../hooks/useReportQueries'
import { formatCurrency } from '../components/ReportComponents'
import { DateRangeFilter, useDateRange } from '../components/DateRangeFilter'

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  cash: { label: 'Cash', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
  card: { label: 'Card', color: 'bg-blue-500', bg: 'bg-blue-50' },
  upi: { label: 'UPI', color: 'bg-violet-500', bg: 'bg-violet-50' },
  online: { label: 'Online', color: 'bg-amber-500', bg: 'bg-amber-50' },
  credit: { label: 'Credit', color: 'bg-red-500', bg: 'bg-red-50' },
}

function TrendBadge({ value, label }: { value: number | null | undefined; label: string }) {
  if (value === null || value === undefined) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-gray-400'
    }`}>
      {value > 0 ? <ArrowUp size={12} /> : value < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
      {Math.abs(value).toFixed(1)}% {label}
    </span>
  )
}

function KpiCard({ label, value, subtitle, icon: Icon, color, trend }: {
  label: string; value: string; subtitle?: string; icon: typeof DollarSign; color: string; trend?: { value: number; label: string }
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-900', iconBg: 'bg-emerald-500' },
    blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-900', iconBg: 'bg-blue-500' },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-900', iconBg: 'bg-indigo-500' },
    purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-900', iconBg: 'bg-purple-500' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-900', iconBg: 'bg-amber-500' },
    red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-900', iconBg: 'bg-red-500' },
  }
  const c = colorMap[color] || colorMap.emerald
  return (
    <div className={`rounded-xl border ${c.border} bg-white p-5 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg} text-white shadow-sm`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text} tracking-tight`}>{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend && <TrendBadge value={trend.value} label={trend.label} />}
      </div>
    </div>
  )
}

export function SalesSummaryPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data: summary, isLoading: summaryLoading } = useSalesReport(fromDate, toDate)
  const { data: daily } = useDailySalesSummary()

  const maxSales = useMemo(() => {
    if (!summary?.dailyTrend?.length) return 1
    return Math.max(...summary.dailyTrend.map(d => d.totalSales), 1)
  }, [summary])

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Summary</h1>
              {summary && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {summary.invoiceCount} invoices
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Revenue, orders, and performance overview</p>
          </div>
        </div>
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={summaryLoading ? '...' : formatCurrency(summary?.totalSales || 0)}
          subtitle="gross sales"
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          label="Total Orders"
          value={summaryLoading ? '...' : String(summary?.invoiceCount || 0)}
          subtitle="invoices processed"
          icon={Receipt}
          color="blue"
        />
        <KpiCard
          label="Avg Order Value"
          value={summaryLoading ? '...' : `₹${Number(summary?.averageOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="per invoice"
          icon={ShoppingCart}
          color="indigo"
        />
        <KpiCard
          label="Total Tax"
          value={summaryLoading ? '...' : formatCurrency(summary?.totalTax || 0)}
          subtitle="GST collected"
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Revenue Trend */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Daily Revenue Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 14 days</p>
            </div>
            {summary?.dailyTrend && summary.dailyTrend.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400" /> Revenue</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-300" /> Orders</span>
              </div>
            )}
          </div>
          <div className="px-5 pb-5">
            {summaryLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 bg-gray-100 rounded w-16" />
                    <div className="h-6 bg-gray-100 rounded flex-1" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : summary?.dailyTrend && summary.dailyTrend.length > 0 ? (
              <div className="space-y-1.5">
                {summary.dailyTrend.slice(-14).map((d) => {
                  const pct = maxSales > 0 ? (d.totalSales / maxSales) * 100 : 0
                  const isToday = d.date === todayStr
                  const orderMax = Math.max(...summary.dailyTrend.map(x => x.orderCount), 1)
                  const orderPct = orderMax > 0 ? (d.orderCount / orderMax) * 100 : 0
                  return (
                    <div
                      key={d.date}
                      className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
                        isToday ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-20 shrink-0">
                        <p className={`text-xs font-medium ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                        {isToday && <p className="text-[10px] text-emerald-600 font-medium">Today</p>}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3.5 bg-gray-100 rounded overflow-hidden">
                          <div className={`h-full rounded ${isToday ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="h-2 bg-gray-100 rounded overflow-hidden">
                          <div className="h-full rounded bg-amber-300" style={{ width: `${orderPct}%` }} />
                        </div>
                      </div>
                      <div className="w-28 text-right shrink-0">
                        <p className="text-xs font-semibold text-gray-900">{formatCurrency(d.totalSales)}</p>
                        <p className="text-[10px] text-gray-400">{d.orderCount} orders · ₹{d.totalTax > 0 ? (d.totalTax / d.orderCount).toFixed(0) : 0} avg tax</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12">
                <BarChart3 size={36} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">No sales data</p>
                <p className="text-xs text-gray-400 mt-1">No orders found for the selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={15} className="text-gray-400" />
              <h3 className="font-semibold text-gray-900">Today's Summary</h3>
            </div>
            <p className="text-xs text-gray-400">Live data for {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="px-5 pb-5">
            {!daily ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wider">Revenue</p>
                    <p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(daily.totalSales)}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">{daily.orderCount} orders</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                    <p className="text-[10px] text-blue-600 uppercase font-semibold tracking-wider">Avg Order</p>
                    <p className="text-xl font-bold text-blue-800 mt-1">₹{Number(daily.averageOrderValue).toFixed(2)}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">per invoice</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
                    <p className="text-[10px] text-purple-600 uppercase font-semibold tracking-wider">Tax</p>
                    <p className="text-lg font-bold text-purple-800 mt-1">{formatCurrency(daily.totalTax)}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">GST collected</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                    <p className="text-[10px] text-amber-600 uppercase font-semibold tracking-wider">Discount</p>
                    <p className="text-lg font-bold text-amber-800 mt-1">{formatCurrency(daily.totalDiscount)}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">given today</p>
                  </div>
                </div>

                {daily.paymentBreakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Payment Methods</p>
                    <div className="space-y-2">
                      {daily.paymentBreakdown.map((p) => {
                        const cfg = METHOD_CONFIG[p.method] || { label: p.method, color: 'bg-gray-400', bg: 'bg-gray-50' }
                        const pct = daily.totalSales > 0 ? (p.total / daily.totalSales) * 100 : 0
                        return (
                          <div key={p.method}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-600">{cfg.label}</span>
                              <span className="text-gray-900 font-semibold">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Period Statistics */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Period Statistics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Detailed breakdown for selected range</p>
            </div>
          </div>
          <div className="px-5 pb-5">
            {summaryLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Subtotal', value: formatCurrency(summary.totalSubtotal), bg: 'bg-gray-50', border: 'border-gray-200' },
                  { label: 'Discounts', value: `-${formatCurrency(summary.totalDiscount)}`, bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
                  { label: 'Net Sales', value: formatCurrency(summary.totalSales), bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
                  { label: 'Tax Collected', value: formatCurrency(summary.totalTax), bg: 'bg-purple-50', border: 'border-purple-100' },
                  { label: 'Min Order', value: formatCurrency(summary.minOrder), bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Max Order', value: formatCurrency(summary.maxOrder), bg: 'bg-indigo-50', border: 'border-indigo-100' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl p-4 text-center`}>
                    <p className={`text-xl font-bold ${s.text || 'text-gray-900'}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Hourly Distribution hint */}
        {daily?.totalSales && daily.totalSales > 0 && (
          <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Sun size={15} className="text-amber-400" />
                <h3 className="font-semibold text-gray-900">Today's Order Summary</h3>
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Sunrise size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Subtotal</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(daily.totalSubtotal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <ArrowDown size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Discounts</p>
                    <p className="text-sm font-semibold text-red-600">-{formatCurrency(daily.totalDiscount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <ArrowUp size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Net Revenue</p>
                    <p className="text-sm font-semibold text-emerald-700">{formatCurrency(daily.totalSales)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <Percent size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg Discount Rate</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {daily.totalSubtotal > 0 ? ((daily.totalDiscount / daily.totalSubtotal) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
