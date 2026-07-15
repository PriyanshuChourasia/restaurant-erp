import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, CheckCircle, Calendar } from 'lucide-react'
import { InventoryModal } from '../components/InventoryModal'
import { useSetOpeningBalance } from '../hooks/useInventoryQueries'
import { getItems, type Item } from '@/modules/items/api/items.api'
import { getOpeningStock } from '../api/inventory.api'

interface AddInventoryItemDialogProps {
  onClose: () => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

export function AddInventoryItemDialog({ onClose }: AddInventoryItemDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['items-for-inventory', search],
    queryFn: () => getItems({ limit: 20, search: search || undefined }),
    enabled: !selectedItem,
  })
  const items = data?.items || []

  // Check if opening stock already declared for selected item
  const { data: openingStockInfo, isLoading: checkingOpening } = useQuery({
    queryKey: ['opening-stock', selectedItem?.id],
    queryFn: () => getOpeningStock(selectedItem!.id),
    enabled: !!selectedItem,
  })

  const isAlreadyOpened = !!openingStockInfo

  const setOpeningBalance = useSetOpeningBalance()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedItem) {
      setError('Select an item first')
      return
    }
    const qty = Number(quantity)
    const cost = Number(unitCost)
    if (!quantity || qty < 0) {
      setError('Enter a valid opening quantity')
      return
    }
    if (!unitCost || cost < 0) {
      setError('Enter a valid unit cost')
      return
    }
    setOpeningBalance.mutate(
      { itemId: selectedItem.id, quantity: qty, unitCost: cost },
      {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err?.response?.data?.message || 'Failed to save opening balance'),
      },
    )
  }

  return (
    <InventoryModal title="Add Item to Inventory" subtitle="Set the opening stock balance for a menu item" onClose={onClose}>
      {!selectedItem ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No items found</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.sku} · {item.unit?.code || item.unit?.name || ''}</p>
                  </div>
                  <p className="text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : checkingOpening ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-400">Checking opening stock status...</p>
        </div>
      ) : isAlreadyOpened ? (
        /* ── Read-only "already opened" summary ─────────────── */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedItem.name}</p>
              <p className="text-xs text-gray-400">{selectedItem.sku} · {selectedItem.unit?.code || selectedItem.unit?.name || ''}</p>
            </div>
            <button type="button" onClick={() => setSelectedItem(null)} className="text-xs font-medium text-primary hover:underline">
              Change
            </button>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Opening Stock Already Declared</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Opened On</p>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Calendar size={14} />
                  <span>{formatDate(openingStockInfo.asOfDate)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Opening Quantity</p>
                <p className="font-semibold text-gray-900">{openingStockInfo.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Unit Cost</p>
                <p className="font-semibold text-gray-900">{formatCurrency(openingStockInfo.unitCost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Current Stock</p>
                <p className="font-semibold text-gray-900">{openingStockInfo.currentStock}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              To adjust stock levels, use the <strong>Adjust Stock</strong> action instead.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-lg bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      ) : (
        /* ── Editable opening balance form ──────────────────── */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedItem.name}</p>
              <p className="text-xs text-gray-400">{selectedItem.sku} · {selectedItem.unit?.code || selectedItem.unit?.name || ''}</p>
            </div>
            <button type="button" onClick={() => setSelectedItem(null)} className="text-xs font-medium text-primary hover:underline">
              Change
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Opening Quantity ({selectedItem.unit?.code || selectedItem.unit?.name || ''})</label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
              className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setOpeningBalance.isPending}
              className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {setOpeningBalance.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </InventoryModal>
  )
}
