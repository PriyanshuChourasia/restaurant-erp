import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, ClipboardList, IndianRupee, Package, Search } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

interface SupplierOption {
  id: string
  name: string
}

interface ItemOption {
  id: string
  name: string
  sku: string
  gstRate: number
  productType: string
  categoryName: string | null
  unit?: { code: string; name: string }
}

interface LineItem {
  itemId: string
  itemName: string
  sku: string
  quantity: number
  unitPrice: number
  gstRate: number
}

interface Props {
  onClose: () => void
}

export function CreatePurchaseDialog({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [itemSearch, setItemSearch] = useState('')
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => apiClient.get<{ data: SupplierOption[] }>('/suppliers', { params: { limit: 100 } }).then(r => r.data),
  })
  const suppliers: SupplierOption[] = suppliersData?.data || []

  // Fetch items
  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => apiClient.get<{ items: ItemOption[] }>('/items', { params: { limit: 200 } }).then(r => r.data),
  })
  const items: ItemOption[] = itemsData?.items || []

  // Extract unique categories from items for the category filter
  const categories = Array.from(new Set(items.filter(i => i.categoryName).map(i => i.categoryName!))).sort()

  // Filter items for picker
  const filteredItems = items
    .filter((i) => {
      if (groupFilter === 'all') return true
      return i.productType === groupFilter
    })
    .filter((i) => {
      if (categoryFilter === 'all') return true
      return i.categoryName === categoryFilter
    })
    .filter((i) => {
      if (!itemSearch) return true
      return i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.sku.toLowerCase().includes(itemSearch.toLowerCase())
    })

  const createMutation = useMutation({
    mutationFn: (payload: {
      supplierId: string
      purchaseDate: string
      items: Array<{ itemId: string; quantity: number; unitPrice: number; gstRate: number }>
      notes?: string
    }) => apiClient.post('/purchases', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      onClose()
    },
  })

  const addLineItem = (item: ItemOption) => {
    setLineItems([...lineItems, {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      quantity: 1,
      unitPrice: 0,
      gstRate: item.gstRate,
    }])
    setShowItemPicker(false)
    setItemSearch('')
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
  const taxAmount = lineItems.reduce((s, li) => s + (li.quantity * li.unitPrice * li.gstRate) / 100, 0)
  const totalAmount = subtotal + taxAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || lineItems.length === 0) return
    createMutation.mutate({
      supplierId,
      purchaseDate,
      items: lineItems.map((li) => ({
        itemId: li.itemId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        gstRate: li.gstRate,
      })),
      notes: notes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">New Purchase Order</h3>
              <p className="text-xs text-gray-500">Record a purchase from a supplier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={createMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Supplier & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                Line Items
                {lineItems.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">({lineItems.length} items)</span>
                )}
              </h4>
              <button
                type="button"
                onClick={() => setShowItemPicker(!showItemPicker)}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 transition-all"
              >
                <Plus size={13} />
                Add Item
              </button>
            </div>

            {/* Item Picker */}
            {showItemPicker && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                {/* Stock Group Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mr-1">Group</span>
                  {[
                    { value: 'all', label: 'All', color: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
                    { value: 'raw', label: 'Raw Mat.', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
                    { value: 'finished', label: 'Finished', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
                    { value: 'semi_finished', label: 'Prep Item', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => { setGroupFilter(g.value); setCategoryFilter('all') }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        groupFilter === g.value ? 'ring-2 ring-offset-1 ring-primary/40 ' + g.color : g.color + ' opacity-70'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                {categories.length > 0 && groupFilter !== 'all' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mr-1">Category</span>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                        categoryFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          categoryFilter === cat ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full h-8 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    autoFocus
                  />
                </div>

                {/* Item List */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[10px] text-gray-400 font-medium">{filteredItems.length} items</span>
                  </div>
                  {filteredItems.slice(0, 50).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addLineItem(item)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          item.productType === 'raw' ? 'bg-amber-400' :
                          item.productType === 'semi_finished' ? 'bg-purple-400' :
                          'bg-blue-400'
                        }`} />
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 truncate block">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{item.sku}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.categoryName && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.categoryName}</span>
                        )}
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          GST {item.gstRate}%
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredItems.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No items match the current filters</p>
                  )}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            {lineItems.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase">Item</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase w-24">Qty</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase w-28">Unit Price</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase w-16">GST</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase w-28">Total</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{li.itemName}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{li.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={li.quantity}
                            onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full h-7 rounded-md border border-gray-200 px-2 text-right text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative">
                            <IndianRupee size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={li.unitPrice || ''}
                              onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full h-7 rounded-md border border-gray-200 pl-6 pr-2 text-right text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-xs text-gray-500">{li.gstRate}%</span>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-900">
                          ₹{(li.quantity * li.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                <Package size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No items added yet</p>
                <p className="text-xs text-gray-300 mt-1">Click "Add Item" to add line items</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional information..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>

          {/* Totals Summary */}
          {lineItems.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (GST)</span>
                <span className="text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {createMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
              {(createMutation.error as any)?.response?.data?.message || 'Failed to create purchase order'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !supplierId || lineItems.length === 0 || !lineItems.every((li) => li.quantity > 0 && li.unitPrice >= 0)}
              className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <ClipboardList size={15} />
                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
