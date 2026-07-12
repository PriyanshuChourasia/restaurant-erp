import { InventoryModal } from '../components/InventoryModal'
import { useStockMovements } from '../hooks/useInventoryQueries'

interface StockHistoryDialogProps {
  itemId: string
  itemName: string
  unit: string
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  opening_balance: 'Opening Balance',
  purchase_in: 'Purchase In',
  sale_out: 'Sale Out',
  adjustment_in: 'Adjustment In',
  adjustment_out: 'Adjustment Out',
  wastage: 'Wastage',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
}

const IN_TYPES = new Set(['opening_balance', 'purchase_in', 'adjustment_in', 'transfer_in'])

export function StockHistoryDialog({ itemId, itemName, unit, onClose }: StockHistoryDialogProps) {
  const { data, isLoading } = useStockMovements(itemId, 1, 50)
  const movements = data?.data || []

  return (
    <InventoryModal title="Stock History" subtitle={itemName} onClose={onClose}>
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
      ) : movements.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No stock movements recorded yet</p>
      ) : (
        <div className="space-y-2">
          {movements.map((m: any) => {
            const isIn = IN_TYPES.has(m.type)
            return (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[m.type] || m.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleString()}
                    {m.reference && ` · ${m.reference}`}
                  </p>
                  {m.notes && <p className="text-xs text-gray-400 mt-0.5">{m.notes}</p>}
                </div>
                <div className="text-right shrink-0 pl-3">
                  <p className={`text-sm font-semibold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isIn ? '+' : '-'}{m.quantity} {unit}
                  </p>
                  <p className="text-xs text-gray-400">{m.balanceBefore} → {m.balanceAfter}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </InventoryModal>
  )
}
