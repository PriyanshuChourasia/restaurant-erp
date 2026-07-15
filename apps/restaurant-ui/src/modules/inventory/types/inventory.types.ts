export type BatchStatus = 'active' | 'exhausted' | 'expired' | 'written_off'

export interface StockBatch {
  id: string
  itemId: string
  storageUnitId: string
  purchaseId: string | null
  parentBatchId: string | null
  batchNumber: string
  quantityReceived: number
  quantityRemaining: number
  unitCost: number
  receivedDate: string
  expiryDate: string | null
  status: BatchStatus
  createdAt: string
  updatedAt: string
  item?: { id: string; name: string; sku: string; unit: { code: string; name: string }; category?: { name: string } }
  storageUnit?: { id: string; name: string; code: string }
}

export interface StorageUnit {
  id: string
  name: string
  code: string
  type: 'store' | 'kitchen' | 'bar' | 'cold_storage' | 'other'
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
