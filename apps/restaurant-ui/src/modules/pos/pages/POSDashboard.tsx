import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Plus, Search, Minus, ShoppingCart, Trash2, CreditCard, UtensilsCrossed,
  IndianRupee, Hash, Users,
} from 'lucide-react'
import { getItems } from '@/modules/items/api/items.api'
import { getCategories } from '@/modules/category/api/category.api'

import { CustomerCombobox } from '@/modules/customers/components/CustomerCombobox'
import { SeatingPanel } from '@/modules/pos/components/SeatingPanel'
import { ChargeModal } from '@/modules/pos/components/ChargeModal'
import { ReceiptDialog } from '@/modules/pos/components/ReceiptDialog'
import { createInvoice, createKot } from '../api/pos.api'
import type { CustomerSearchResult } from '@/modules/customers/types/customer.types'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

interface CartItem {
  id: string
  itemId: string
  name: string
  hsnCode: string
  price: number
  gstRate: number
  quantity: number
  unitCode: string
}

export function POSDashboard() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<string | null>(null)

  const { data: itemsData } = useQuery({
    queryKey: ['items-pos'],
    queryFn: () => getItems({ limit: 200 }),
  })
  const { data: cats } = useQuery({
    queryKey: ['categories-pos'],
    queryFn: () => getCategories({ limit: 100 }),
  })
  const filteredItems = (itemsData?.items || []).filter((item: any) => {
    const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.isActive
  })

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id)
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          id: item.id,
          itemId: item.id,
          name: item.name,
          hsnCode: item.hsnCode,
          price: item.price,
          gstRate: item.gstRate,
          quantity: 1,
          unitCode: item.unit?.code || '',
        },
      ]
    })
  }

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.itemId === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  const removeItem = (itemId: string) =>
    setCart((prev) => prev.filter((i) => i.itemId !== itemId))

  const handleTableToggle = useCallback((tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId],
    )
  }, [])

  // GST Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity) / (1 + item.gstRate / 100),
    0,
  )
  const cgstTotal = cart.reduce((sum, item) => {
    const taxable = (item.price * item.quantity) / (1 + item.gstRate / 100)
    return sum + (taxable * (item.gstRate / 2)) / 100
  }, 0)
  const sgstTotal = cgstTotal
  const taxTotal = cgstTotal + sgstTotal
  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100
  const roundOff = Math.round((Math.round(grandTotal) - grandTotal) * 100) / 100
  const finalTotal = Math.round(grandTotal)

  const billMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const invoice = await createInvoice({
        customerId: selectedCustomer?.id ?? undefined,
        tableIds: selectedTableIds.length > 0 ? selectedTableIds : undefined,
        paymentMethod,
        items: cart.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
        })),
      })

      // Create KOT
      if (cart.length > 0) {
        await createKot({
          orderId: invoice.id,
          tableIds: selectedTableIds.length > 0 ? selectedTableIds : undefined,
          station: 'main_kitchen',
          items: cart.map((i) => ({
            itemId: i.itemId,
            itemName: i.name,
            quantity: i.quantity,
          })),
        })
      }

      return invoice
    },
    onSuccess: (invoice) => {
      setShowChargeModal(false)
      setReceiptInvoiceId(invoice.id)
      setCart([])
      setSelectedTableIds([])
    },
  })

  return (
    <div className="flex flex-1">
      {/* Left - Menu Items */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 bg-white p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {(cats?.items || []).map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="group rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <UtensilsCrossed size={18} />
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.isVeg ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    }`}
                  >
                    {item.isVeg ? 'V' : 'NV'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.categoryName || ''}</p>
                <div className="flex items-center gap-1 mt-2">
                  <IndianRupee size={12} className="text-gray-500" />
                  <p className="text-sm font-bold text-gray-900">
                    ₹{item.price.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  GST {item.gstRate}%{item.unit?.code ? ` | ${item.unit.code}` : ''} | {item.hsnCode}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Cart */}
      <div className="flex w-96 flex-col border-l border-gray-200 bg-white">
        {/* Cart Header - Customer + Seating + Payment */}
        <div className="border-b border-gray-200 p-4 space-y-3">
          {/* Customer picker */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              <Users size={12} className="inline mr-1" />
              Customer
            </label>
            <CustomerCombobox
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          {/* Seating */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              <Hash size={12} className="inline mr-1" />
              Seating
            </label>              <SeatingPanel
              selectedTableIds={selectedTableIds}
              onTableToggle={handleTableToggle}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Current Order ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h3>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Cart is empty</p>
              <p className="text-xs text-gray-300">Select items from the menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.itemId}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    ₹{item.price.toFixed(2)} {item.unitCode ? `/${item.unitCode}` : 'each'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.itemId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-medium text-gray-900">
                    <FormattedQuantity quantity={item.quantity} unit={item.unitCode} variant="full" />
                  </span>
                  <button
                    onClick={() => updateQty(item.itemId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.itemId)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* GST Bill Summary */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Taxable Value</span>
            <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">CGST</span>
            <span className="text-gray-900">₹{cgstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">SGST</span>
            <span className="text-gray-900">₹{sgstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Round Off</span>
            <span className="text-gray-900">{roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-bold text-gray-900">Grand Total</span>
            <span className="text-base font-bold text-primary">
              ₹{finalTotal.toFixed(2)}
            </span>
          </div>

          <button
            disabled={cart.length === 0 || billMutation.isPending}
            onClick={() => setShowChargeModal(true)}
            className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={18} />
            Charge ₹{finalTotal.toFixed(2)}
          </button>
        </div>
      </div>

      <ChargeModal
        open={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        onConfirm={(method) => billMutation.mutate(method)}
        cart={cart}
        subtotal={subtotal}
        cgstTotal={cgstTotal}
        sgstTotal={sgstTotal}
        roundOff={roundOff}
        finalTotal={finalTotal}
        isPending={billMutation.isPending}
      />

      {receiptInvoiceId && (
        <ReceiptDialog
          invoiceId={receiptInvoiceId}
          onClose={() => setReceiptInvoiceId(null)}
        />
      )}
    </div>
  )
}
