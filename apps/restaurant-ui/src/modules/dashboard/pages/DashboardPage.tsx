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
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

const kpiCards = [
  {
    label: 'Today\'s Revenue',
    value: '₹12,840',
    change: '+15.3%',
    trend: 'up',
    icon: DollarSign,
    color: 'emerald',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Total Orders',
    value: '156',
    change: '+12.1%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'blue',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500',
  },
  {
    label: 'Avg Order Value',
    value: '₹82.30',
    change: '-2.1%',
    trend: 'down',
    icon: IndianRupee,
    color: 'amber',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
  },
  {
    label: 'Active Tables',
    value: '12/20',
    change: '60% occupancy',
    trend: 'neutral',
    icon: Users,
    color: 'purple',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-500',
  },
]

const recentOrders = [
  { id: '#1045', table: 'Table 7', items: 3, total: 520, status: 'In Progress', time: '2 min ago' },
  { id: '#1044', table: 'Table 12', items: 5, total: 785, status: 'New', time: '5 min ago' },
  { id: '#1043', table: 'Table 3', items: 2, total: 340, status: 'Completed', time: '12 min ago' },
  { id: '#1042', table: 'Table 8', items: 4, total: 672, status: 'Completed', time: '18 min ago' },
  { id: '#1041', table: 'Table 5', items: 1, total: 180, status: 'In Progress', time: '22 min ago' },
]

const quickActions = [
  { label: 'New Order', icon: ShoppingCart, to: '/pos', color: 'bg-primary text-white' },
  { label: 'Add Item', icon: UtensilsCrossed, to: '/items/create', color: 'bg-emerald-500 text-white' },
  { label: 'KOT Board', icon: Clock, to: '/kot', color: 'bg-amber-500 text-white' },
  { label: 'Sales Report', icon: TrendingUp, to: '/reports', color: 'bg-blue-500 text-white' },
]

const topItems = [
  { name: 'Butter Chicken', orders: 28, revenue: 7840, trend: '+12%' },
  { name: 'Biryani', orders: 24, revenue: 6000, trend: '+8%' },
  { name: 'Dal Makhani', orders: 20, revenue: 3600, trend: '+15%' },
  { name: 'Naan Bread', orders: 18, revenue: 1080, trend: '+5%' },
  { name: 'Gulab Jamun', orders: 15, revenue: 1200, trend: '+20%' },
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
    'Cancelled': 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
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
          <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
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
                  <span className={`text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-emerald-600' :
                    kpi.trend === 'down' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
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
            <select className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-600 outline-none">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-2 h-44 pt-4">
            {[
              { day: 'Mon', val: 65, rev: 8400 },
              { day: 'Tue', val: 78, rev: 10200 },
              { day: 'Wed', val: 52, rev: 6800 },
              { day: 'Thu', val: 91, rev: 12400 },
              { day: 'Fri', val: 85, rev: 11200 },
              { day: 'Sat', val: 72, rev: 9400 },
              { day: 'Sun', val: 88, rev: 11800 },
            ].map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400">₹{(d.rev / 1000).toFixed(1)}k</span>
                <div
                  className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${d.val}%`,
                    background: i === 3
                      ? 'linear-gradient(180deg, #6366f1 0%, #818cf8 100%)'
                      : 'linear-gradient(180deg, #c7d2fe 0%, #e0e7ff 100%)',
                  }}
                />
                <span className="text-[11px] font-medium text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Popular Items</h3>
              <p className="text-xs text-gray-400 mt-0.5">Today</p>
            </div>
            <Link to="/items" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {topItems.map((item, i) => (
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
                    <span className="text-xs text-gray-400">{item.orders} orders</span>
                    <span className="text-xs text-gray-400">₹{item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest orders from today</p>
          </div>
          <Link to="/orders" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View All Orders
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Table</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2 font-semibold text-gray-900">{order.id}</td>
                  <td className="py-3 px-2 text-gray-600">{order.table}</td>
                  <td className="py-3 px-2 text-gray-600">{order.items}</td>
                  <td className="py-3 px-2 font-semibold text-gray-900">₹{order.total.toFixed(2)}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-400">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Date</p>
            <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Time</p>
            <p className="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</p>
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
    </div>
  )
}
