import { useState } from 'react'
import { InventoryModal } from '../components/InventoryModal'
import { useAdjustStock } from '../hooks/useInventoryQueries'

interface AdjustStockDialogProps {
  itemId: string
  itemName: string
  unit: string
  onClose: () => void
}

const ADJUSTMENT_TYPES = [
  { value: 'adjustment_in', label: 'Adjustment In (stock found/corrected up)' },
  { value: 'adjustment_out', label: 'Adjustment Out (stock corrected down)' },
  { value: 'wastage', label: 'Wastage / Spoilage' },
  { value: 'transfer_in', label: 'Transfer In (from another outlet)' },
  { value: 'transfer_out', label: 'Transfer Out (to another outlet)' },
]

export function AdjustStockDialog({ itemId, itemName, unit, onClose }: AdjustStockDialogProps) {
  const [type, setType] = useState('adjustment_in')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const adjustStock = useAdjustStock()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setError('Enter a quantity greater than 0')
      return
    }
    adjustStock.mutate(
      { itemId, type, quantity: qty, notes: notes || undefined, reference: reference || undefined },
      {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err?.response?.data?.message || 'Failed to adjust stock'),
      },
    )
  }

  return (
    <InventoryModal title="Adjust Stock" subtitle={itemName} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Adjustment Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            {ADJUSTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity {unit && `(${unit})`}</label>
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
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Reference (optional)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. GRN-1023"
            className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Reason for adjustment..."
            className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-none"
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
            disabled={adjustStock.isPending}
            className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {adjustStock.isPending ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </form>
    </InventoryModal>
  )
}
