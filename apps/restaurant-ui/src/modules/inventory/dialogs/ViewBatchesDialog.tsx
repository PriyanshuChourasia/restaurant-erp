import { useItemBatches } from '../hooks/useInventoryQueries'
import { InventoryModal } from '../components/InventoryModal'
import { Package, AlertTriangle, Clock, Layers, Loader2 } from 'lucide-react'
import {
  STATUS_CONFIG,
  daysUntil,
  formatDate,
} from '../utils/batch-utils'
import type { BatchStatus } from '../utils/batch-utils'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

interface ViewBatchesDialogProps {
  itemId: string
  itemName: string
  onClose: () => void
}

export function ViewBatchesDialog({ itemId, itemName, onClose }: ViewBatchesDialogProps) {
  const { data: batches, isLoading } = useItemBatches(itemId)

  const activeBatches = batches?.filter((b) => b.status === 'active') || []
  const totalRemaining = batches?.reduce((s, b) => s + b.quantityRemaining, 0) || 0
  const unitCode = batches?.[0]?.item?.unit?.code || ''

  return (
    <InventoryModal title="Batches" subtitle={itemName} onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : !batches || batches.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Layers size={36} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No batches tracked for this item</p>
          <p className="text-xs text-gray-400 mt-1">Batches are created automatically on purchase receipt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-1.5 text-sm">
              <Layers size={14} className="text-gray-400" />
              <span className="text-gray-600">{batches.length} batches</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Package size={14} className="text-gray-400" />
              <span className="text-gray-600">
                <FormattedQuantity quantity={totalRemaining} unit={unitCode} variant="compact" /> total
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-600">{activeBatches.length} active</span>
            </div>
          </div>

          {/* Batch List */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {batches.map((batch) => {
              const config = STATUS_CONFIG[batch.status as BatchStatus] || STATUS_CONFIG.active
              const days = daysUntil(batch.expiryDate)
              const batchUnit = batch.item?.unit?.code || unitCode
              return (
                <div key={batch.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {batch.batchNumber}
                        </code>
                        <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${config.class}`}>
                          {config.label}
                        </span>
                        {batch.expiryDate && days !== null && days <= 7 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600">
                            <AlertTriangle size={10} />
                            Expiring
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>Received {formatDate(batch.receivedDate)}</span>
                        {batch.expiryDate && <span>Expires {formatDate(batch.expiryDate)}</span>}
                        {batch.storageUnit && <span>@{batch.storageUnit.name}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        <FormattedQuantity quantity={batch.quantityRemaining} unit={batchUnit} variant="full" />
                        <span className="text-xs text-gray-400 font-normal">
                          {' / '}<FormattedQuantity quantity={batch.quantityReceived} unit={batchUnit} variant="full" />
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">₹{Number(batch.unitCost).toFixed(2)}/u</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </InventoryModal>
  )
}
