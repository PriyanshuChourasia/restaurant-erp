import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  IndianRupee,
  Send,
  CreditCard,
  Users,
  Truck,
  UtensilsCrossed,
  CalendarClock,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  getOrders, confirmOrder, sendOrderToKitchen, chargeOrder, cancelOrder, updateOrderItems,
} from '../api/orders.api'
import { getItems } from '@/modules/items/api/items.api'
import type { Order, OrderStatus, OrderType } from '../types/order.types'

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending_confirmation', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'billed', label: 'Billed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending_confirmation: { label: 'Pending', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  billed: { label: 'Billed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

const typeConfig: Record<OrderType, { label: string; bg: string; text: string; icon: typeof Users }> = {
  regular: { label: 'Regular', bg: 'bg-gray-100', text: 'text-gray-700', icon: UtensilsCrossed },
  party: { label: 'Party', bg: 'bg-purple-50', text: 'text-purple-700', icon: Users },
  scheduled: { label: 'Scheduled', bg: 'bg-cyan-50', text: 'text-cyan-700', icon: CalendarClock },
}

const fulfillmentIcon: Record<string, typeof UtensilsCrossed> = {
  dine_in: UtensilsCrossed,
  takeaway: ShoppingCart,
  delivery: Truck,
}

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'online', 'credit']

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [chargingOrderId, setChargingOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [editingItems, setEditingItems] = useState<{ itemId: string; itemName: string; quantity: string }[] | null>(null)
  const [pickerItemId, setPickerItemId] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => getOrders({ page: 1, limit: 50, status: activeTab === 'all' ? undefined : activeTab }),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-order-picker'],
    queryFn: () => getItems({ limit: 200 }),
  })

  const orders: Order[] = data?.data || []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] })

  const confirmMutation = useMutation({ mutationFn: confirmOrder, onSuccess: invalidate })
  const sendToKitchenMutation = useMutation({ mutationFn: sendOrderToKitchen, onSuccess: invalidate })
  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => { invalidate(); setSelectedOrderId(null) },
  })
  const chargeMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) => chargeOrder(id, method),
    onSuccess: () => { invalidate(); setChargingOrderId(null); setSelectedOrderId(null) },
  })
  const updateItemsMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: Array<{ itemId: string; quantity: number }> }) => updateOrderItems(id, items),
    onSuccess: () => { invalidate(); setEditingItems(null) },
  })

  const startEditingItems = (order: Order) => {
    setEditingItems(order.items.map((i) => ({ itemId: i.itemId, itemName: i.itemName, quantity: String(i.quantity) })))
  }

  const addPickerItem = () => {
    const item = (itemsData?.items || []).find((i: any) => i.id === pickerItemId)
    if (!item || !editingItems) return
    if (editingItems.some((i) => i.itemId === item.id)) return
    setEditingItems([...editingItems, { itemId: item.id, itemName: item.name, quantity: '1' }])
    setPickerItemId('')
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q)
    )
  })

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null

  const totalRevenue = orders.filter((o) => o.status === 'billed').reduce((sum, o) => sum + Number(o.grandTotal), 0)
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length
  const billedCount = orders.filter((o) => o.status === 'billed').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Regular, party, and scheduled orders — from placement to bill.</p>
        </div>
        <Link
          to="/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus size={16} />
          New Order
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingCart, iconBg: 'bg-blue-500' },
          { label: 'Awaiting Kitchen/Bill', value: confirmedCount, icon: Clock, iconBg: 'bg-amber-500' },
          { label: 'Billed', value: billedCount, icon: CheckCircle2, iconBg: 'bg-emerald-500' },
          { label: 'Revenue (billed)', value: `₹${totalRevenue.toFixed(2)}`, icon: IndianRupee, iconBg: 'bg-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} text-white`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-1 px-5 pt-4 pb-3 border-b border-gray-100 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:border-primary/40 focus:bg-white focus:ring-3 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
              <ShoppingCart size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-sm text-gray-500">No orders match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fulfillment</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const sConfig = statusConfig[order.status]
                  const tConfig = typeConfig[order.orderType]
                  const StatusIcon = sConfig.icon
                  const TypeIcon = tConfig.icon
                  const FulfillIcon = fulfillmentIcon[order.fulfillmentMethod] || UtensilsCrossed
                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-50 transition-all hover:bg-gray-50/80 cursor-pointer ${selectedOrderId === order.id ? 'bg-primary/5' : ''}`}
                      onClick={() => { setSelectedOrderId(selectedOrderId === order.id ? null : order.id); setEditingItems(null) }}
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        {order.customerName && <p className="text-xs text-gray-400">{order.customerName}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tConfig.bg} ${tConfig.text}`}>
                          <TypeIcon size={12} />
                          {tConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-gray-600 text-xs">
                          <FulfillIcon size={13} />
                          {order.fulfillmentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {order.scheduledFor ? new Date(order.scheduledFor).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {order.items.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">₹{Number(order.grandTotal).toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sConfig.bg} ${sConfig.text}`}>
                            <StatusIcon size={12} />
                            {sConfig.label}
                          </span>
                          {!!order.unavailableItems?.length && (
                            <span title={order.unavailableItems.map((i) => i.itemName).join(', ') + ' unavailable'} className="flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600">
                              <AlertTriangle size={11} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'pending_confirmation' && (
                            <button
                              onClick={() => confirmMutation.mutate(order.id)}
                              disabled={confirmMutation.isPending}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            >
                              <CheckCircle2 size={12} />
                              Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && !order.kotSent && (
                            <button
                              onClick={() => sendToKitchenMutation.mutate(order.id)}
                              disabled={sendToKitchenMutation.isPending}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                            >
                              <Send size={12} />
                              Send to Kitchen
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => setChargingOrderId(order.id)}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-dark"
                            >
                              <CreditCard size={12} />
                              Charge
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedOrderId(selectedOrderId === order.id ? null : order.id); setEditingItems(null) }}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (() => {
        const order = selectedOrder
        const sConfig = statusConfig[order.status]
        const StatusIcon = sConfig.icon
        const canCancel = order.status === 'pending_confirmation' || order.status === 'confirmed'

        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedOrderId(null)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{order.orderNumber}</h2>
                  <p className="text-sm text-gray-500">{order.customerName || 'Walk-in'}</p>
                </div>
                <button onClick={() => { setSelectedOrderId(null); setEditingItems(null) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <XCircle size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${sConfig.bg} ${sConfig.text}`}>
                    <StatusIcon size={14} />
                    {sConfig.label}
                  </span>
                </div>

                {!!order.unavailableItems?.length && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
                    <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      Kitchen flagged as unavailable
                    </p>
                    {order.unavailableItems.map((u, i) => (
                      <p key={i} className="text-xs text-red-600">
                        {u.itemName}{u.note ? ` — ${u.note}` : ''}
                      </p>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {[
                    { label: 'Type', value: typeConfig[order.orderType].label },
                    { label: 'Fulfillment', value: order.fulfillmentMethod.replace('_', ' ') },
                    ...(order.scheduledFor ? [{ label: 'Scheduled for', value: new Date(order.scheduledFor).toLocaleString('en-IN') }] : []),
                    ...(order.partySize ? [{ label: 'Party size', value: String(order.partySize) }] : []),
                    { label: 'Items', value: `${order.items.length} line(s)` },
                    { label: 'Subtotal', value: `₹${Number(order.subtotal).toFixed(2)}` },
                    ...(order.discountPercent ? [{ label: 'Discount', value: `${order.discountPercent}%` }] : []),
                    { label: 'Grand Total', value: `₹${Number(order.grandTotal).toFixed(2)}` },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{detail.label}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{detail.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Line items</p>
                    {(order.status === 'pending_confirmation' || order.status === 'confirmed') && editingItems === null && (
                      <button onClick={() => startEditingItems(order)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Pencil size={11} />
                        Edit
                      </button>
                    )}
                  </div>

                  {editingItems === null ? (
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.itemName} × {Number(item.quantity)}</span>
                          <span className="text-gray-900 font-medium">₹{Number(item.totalAmount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingItems.map((line, i) => (
                        <div key={line.itemId} className="flex items-center gap-2">
                          <span className="flex-1 text-sm text-gray-700 truncate">{line.itemName}</span>
                          <input
                            type="number" min="0" step="0.01" value={line.quantity}
                            onChange={(e) => setEditingItems((prev) => prev!.map((l, j) => (j === i ? { ...l, quantity: e.target.value } : l)))}
                            className="w-16 h-8 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                          />
                          <button onClick={() => setEditingItems((prev) => prev!.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={pickerItemId} onChange={(e) => setPickerItemId(e.target.value)}
                          className="flex-1 h-8 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                        >
                          <option value="">Add item...</option>
                          {(itemsData?.items || []).map((item: any) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        <button onClick={addPickerItem} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setEditingItems(null)}
                          className="flex-1 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const items = editingItems
                              .filter((l) => Number(l.quantity) > 0)
                              .map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) }))
                            if (items.length === 0) return
                            updateItemsMutation.mutate({ id: order.id, items })
                          }}
                          disabled={updateItemsMutation.isPending}
                          className="flex-1 h-8 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-50"
                        >
                          {updateItemsMutation.isPending ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {order.status === 'pending_confirmation' && (
                    <button
                      onClick={() => confirmMutation.mutate(order.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark"
                    >
                      <CheckCircle2 size={16} />
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'confirmed' && !order.kotSent && (
                    <button
                      onClick={() => sendToKitchenMutation.mutate(order.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-600"
                    >
                      <Send size={16} />
                      Send to Kitchen
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => setChargingOrderId(order.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                    >
                      <CreditCard size={16} />
                      Charge
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => window.confirm(`Cancel order ${order.orderNumber}?`) && cancelMutation.mutate(order.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
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

      {/* Charge payment-method picker */}
      {chargingOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setChargingOrderId(null)}>
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900">Select payment method</h3>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`h-10 rounded-lg border-2 text-xs font-medium capitalize transition-all ${
                    paymentMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={() => chargeMutation.mutate({ id: chargingOrderId, method: paymentMethod })}
              disabled={chargeMutation.isPending}
              className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {chargeMutation.isPending ? 'Charging...' : 'Confirm Charge'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
