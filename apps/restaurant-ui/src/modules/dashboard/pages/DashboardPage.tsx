import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CalendarDays,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useDashboardSummary } from '../hooks/useDashboardQueries'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    confirmed: 'Confirmed',
    draft: 'Draft',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] || status
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function DashboardPage() {
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary()

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Failed to load dashboard</h3>
        <p className="text-sm text-gray-500 mb-6">Make sure the server is running and try again.</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90"
        >
          <Loader2 size={15} />
          Retry
        </button>
      </div>
    )
  }

  const kpiCards = [
    {
      label: "Today's Revenue",
      value: summary ? formatCurrency(summary.todayRevenue) : '—',
      change: summary && summary.todayOrders > 0
        ? `${summary.todayOrders} orders`
        : 'No orders today',
      trend: summary && summary.todayRevenue > 0 ? 'up' : 'neutral' as const,
      icon: DollarSign,
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Total Orders',
      value: summary?.todayOrders?.toString() ?? '—',
      change: formatCurrency(summary?.avgOrderValue ?? 0),
      trend: summary && summary.avgOrderValue > 0 ? 'up' : 'neutral' as const,
      icon: ShoppingCart,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Avg Order Value',
      value: summary ? formatCurrency(summary.avgOrderValue) : '—',
      change: (summary?.todayOrders ?? 0) > 0 ? 'per order today' : '—',
      trend: 'neutral' as const,
      icon: IndianRupee,
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Active Tables',
      value: summary ? `${summary.activeTables}/${summary.totalTables}` : '—',
      change: summary && summary.totalTables > 0
        ? `${Math.round((summary.activeTables / summary.totalTables) * 100)}% occupancy`
        : 'No tables configured',
      trend: summary && summary.activeTables > 0 ? 'up' : 'neutral' as const,
      icon: Users,
      iconBg: 'bg-purple-500',
    },
  ]

  const quickActions = [
    { label: 'New Order', icon: ShoppingCart, to: '/pos', color: 'bg-primary text-white' },
    { label: 'Add Item', icon: UtensilsCrossed, to: '/items/create', color: 'bg-emerald-500 text-white' },
    { label: 'KOT Board', icon: Clock, to: '/kot', color: 'bg-amber-500 text-white' },
    { label: 'Sales Report', icon: TrendingUp, to: '/reports', color: 'bg-blue-500 text-white' },
  ]

  const maxRevenue = summary?.revenueTrend?.length
    ? Math.max(...summary.revenueTrend.map((d) => d.sales), 1)
    : 1

  // Today's info
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      {/* Loading overlay for initial load */}
      {isLoading && !summary && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      )}

      {summary && (
        <>
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of your restaurant's performance today.</p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 ${action.color}`}
              >
                <action.icon size={16} />
                {action.label}
              </Link>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg} text-white`}>
                    <kpi.icon size={20} />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {kpi.trend === 'up' && <ArrowUpRight size={14} className="text-emerald-500" />}
                      {kpi.trend === 'down' && <ArrowDownRight size={14} className="text-red-500" />}
                      <span
                        className={`text-xs font-medium ${
                          kpi.trend === 'up'
                            ? 'text-emerald-600'
                            : kpi.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                </div>
                <span className="text-xs text-gray-400 italic">Today: {formatCurrency(summary.todayRevenue)}</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-44 pt-4">
                {summary.revenueTrend.length > 0 ? (
                  summary.revenueTrend.map((d, i) => {
                    const heightPct = maxRevenue > 0 ? (d.sales / maxRevenue) * 100 : 0
                    const isToday = i === summary.revenueTrend.length - 1
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-400">
                          ₹{(d.sales / 1000).toFixed(1)}k
                        </span>
                        <div
                          className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
                          style={{
                            height: `${Math.max(heightPct, 2)}%`,
                            background: isToday
                              ? 'linear-gradient(180deg, #6366f1 0%, #818cf8 100%)'
                              : 'linear-gradient(180deg, #c7d2fe 0%, #e0e7ff 100%)',
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                            {formatCurrency(d.sales)} · {d.orders} orders
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {d.day}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full flex items-center justify-center h-full text-sm text-gray-400">
                    No revenue data for the past week
                  </div>
                )}
              </div>
            </div>

            {/* Top Items */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Popular Items</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <Link
                  to="/items"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All
                </Link>
              </div>
              {summary.popularItems.length > 0 ? (
                <div className="space-y-3">
                  {summary.popularItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <span className="text-xs font-semibold text-emerald-600">{item.trend}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{item.orders} sold</span>
                          <span className="text-xs text-gray-400">{formatCurrency(item.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <UtensilsCrossed size={24} className="opacity-30 mb-2" />
                  <p className="text-sm">No items sold yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-xs text-gray-400 mt-0.5">Latest orders from today</p>
              </div>
              <Link
                to="/orders"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View All Orders
              </Link>
            </div>
            {summary.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-semibold text-gray-900">{order.id}</td>
                        <td className="py-3 px-2 text-gray-600">
                          {order.customerName || (order.tableIds ? `Table ${order.tableIds.join(', ')}` : 'Walk-in')}
                        </td>
                        <td className="py-3 px-2 text-gray-600">{order.items}</td>
                        <td className="py-3 px-2 font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(order.status)}`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-400">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <ShoppingCart size={24} className="opacity-30 mb-2" />
                <p className="text-sm">No orders yet today</p>
                <Link
                  to="/pos"
                  className="text-xs font-medium text-primary hover:text-primary/80 mt-2 transition-colors"
                >
                  Create your first order
                </Link>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-900">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm font-medium text-gray-900">{timeStr} IST</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Currency</p>
                <p className="text-sm font-medium text-gray-900">Indian Rupee (INR)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
