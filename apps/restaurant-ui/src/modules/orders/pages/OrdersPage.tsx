import { useState } from 'react'
import {
  Plus,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ChevronDown,
  Eye,
  IndianRupee,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

// ─── Types ────────────────────────────────────────────────────────────

type OrderStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled'

interface Order {
  id: string
  table: string
  server: string
  items: number
  total: number
  status: OrderStatus
  payment: string
  time: string
}

// ─── Mock data ────────────────────────────────────────────────────────

const orders: Order[] = [
  { id: '#1042', table: 'Table 7', server: 'Mike', items: 3, total: 52.00, status: 'In Progress', payment: 'Card', time: '2 min ago' },
  { id: '#1041', table: 'Table 12', server: 'Sarah', items: 5, total: 78.50, status: 'New', payment: 'Cash', time: '5 min ago' },
  { id: '#1040', table: 'Table 3', server: 'Mike', items: 2, total: 34.00, status: 'Completed', payment: 'Card', time: '12 min ago' },
  { id: '#1039', table: 'Table 8', server: 'Emma', items: 4, total: 67.25, status: 'Completed', payment: 'Card', time: '18 min ago' },
  { id: '#1038', table: 'Table 5', server: 'Sarah', items: 1, total: 18.00, status: 'In Progress', payment: 'Cash', time: '22 min ago' },
  { id: '#1037', table: 'Table 10', server: 'Emma', items: 6, total: 95.00, status: 'Completed', payment: 'Card', time: '35 min ago' },
  { id: '#1036', table: 'Table 2', server: 'Mike', items: 2, total: 28.50, status: 'Cancelled', payment: '-', time: '45 min ago' },
  { id: '#1035', table: 'Table 15', server: 'Sarah', items: 3, total: 44.00, status: 'New', payment: 'Cash', time: '48 min ago' },
  { id: '#1034', table: 'Table 6', server: 'Emma', items: 4, total: 61.00, status: 'Completed', payment: 'Card', time: '55 min ago' },
  { id: '#1033', table: 'Table 9', server: 'Mike', items: 2, total: 22.50, status: 'In Progress', payment: 'UPI', time: '1 hr ago' },
  { id: '#1032', table: 'Table 4', server: 'Sarah', items: 5, total: 89.00, status: 'New', payment: 'Card', time: '1 hr ago' },
  { id: '#1031', table: 'Table 11', server: 'Emma', items: 3, total: 47.00, status: 'Completed', payment: 'Cash', time: '1 hr ago' },
]

const STATUS_TABS = [
  { key: 'all', label: 'All Orders', count: orders.length },
  { key: 'New', label: 'New', count: orders.filter((o) => o.status === 'New').length },
  { key: 'In Progress', label: 'In Progress', count: orders.filter((o) => o.status === 'In Progress').length },
  { key: 'Completed', label: 'Completed', count: orders.filter((o) => o.status === 'Completed').length },
  { key: 'Cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'Cancelled').length },
] as const

const statusConfig: Record<OrderStatus, { label: string; dot: string; bg: string; text: string; icon: typeof Clock }> = {
  'New': { label: 'New', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  'In Progress': { label: 'In Progress', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  'Completed': { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  'Cancelled': { label: 'Cancelled', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

// ─── Component ────────────────────────────────────────────────────────

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'all' || order.status === activeTab
    const matchesSearch =
      !searchQuery ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.server.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const selectedOrderData = selectedOrder
    ? orders.find((o) => o.id === selectedOrder)
    : null

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const completedCount = orders.filter((o) => o.status === 'Completed').length
  const inProgressCount = orders.filter((o) => o.status === 'In Progress').length

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all incoming orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={16} />
            New Order
          </Link>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Orders',
            value: orders.length,
            change: '+12% vs yesterday',
            trend: 'up' as const,
            icon: ShoppingCart,
            iconBg: 'bg-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'In Progress',
            value: inProgressCount,
            change: `${((inProgressCount / orders.length) * 100).toFixed(0)}% of total`,
            trend: 'neutral' as const,
            icon: Clock,
            iconBg: 'bg-amber-500',
            bg: 'bg-amber-50',
          },
          {
            label: 'Completed',
            value: completedCount,
            change: `${((completedCount / orders.length) * 100).toFixed(0)}% completion rate`,
            trend: 'up' as const,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toFixed(2)}`,
            change: `Avg ₹${(totalRevenue / orders.length).toFixed(2)} per order`,
            trend: 'up' as const,
            icon: IndianRupee,
            iconBg: 'bg-purple-500',
            bg: 'bg-purple-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm hover:border-gray-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} text-white`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof stat.value === 'number' ? stat.value : stat.value}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' && <ArrowUpRight size={14} className="text-emerald-500" />}
                  <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters & Search Bar ─── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-3 border-b border-gray-100 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, tables, servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300">
            <ChevronDown size={15} />
            More Filters
          </button>
        </div>
      </div>

      {/* ─── Orders Table ─── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
              <ShoppingCart size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term.' : 'No orders match the selected filter.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Server</th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const config = statusConfig[order.status]
                  const StatusIcon = config.icon
                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-50 transition-all hover:bg-gray-50/80 cursor-pointer ${
                        selectedOrder === order.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-gray-900">{order.id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">{order.table}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                            {order.server.charAt(0)}
                          </div>
                          <span className="text-gray-700">{order.server}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {order.items}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                          <StatusIcon size={12} />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-600">{order.payment}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-400 text-xs">{order.time}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(selectedOrder === order.id ? null : order.id)
                          }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100 hover:border-gray-300"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredOrders.length}</span> of{' '}
            <span className="font-medium text-gray-700">{orders.length}</span> orders
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Revenue: <span className="font-semibold text-gray-700">₹{totalRevenue.toFixed(2)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Order Details Drawer ─── */}
      {selectedOrderData && (() => {
        const order = selectedOrderData
        const config = statusConfig[order.status]
        const StatusIcon = config.icon

        const handleClose = () => setSelectedOrder(null)
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Escape') handleClose()
        }

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={handleClose}
            />
            {/* Drawer */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Order details for ${order.id}`}
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900" id="order-drawer-title">{order.id}</h2>
                  <p className="text-sm text-gray-500">{order.table} · {order.server}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  aria-label="Close order details"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                    <StatusIcon size={14} />
                    {order.status}
                  </span>
                </div>

                {/* Order Details */}
                <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {[
                    { label: 'Order ID', value: order.id },
                    { label: 'Table', value: order.table },
                    { label: 'Server', value: order.server },
                    { label: 'Items', value: `${order.items} ${order.items === 1 ? 'item' : 'items'}` },
                    { label: 'Total', value: `₹${order.total.toFixed(2)}` },
                    { label: 'Payment', value: order.payment },
                    { label: 'Time', value: order.time },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{detail.label}</span>
                      <span className="text-sm font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {order.status === 'New' && (
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-all hover:bg-primary-dark hover:shadow-md">
                      <Clock size={16} />
                      Mark In Progress
                    </button>
                  )}
                  {order.status === 'In Progress' && (
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-600 hover:shadow-md">
                      <CheckCircle2 size={16} />
                      Mark Completed
                    </button>
                  )}
                  {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50">
                      <XCircle size={16} />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
