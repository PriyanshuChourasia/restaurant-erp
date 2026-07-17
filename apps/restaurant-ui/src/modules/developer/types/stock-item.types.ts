export interface DevStockItem {
  id: string
  code: string
  name: string
  alias: string | null
  stockGroup: { id: string; code: string; name: string } | null
  stockCategory: { id: string; name: string } | null
  unitOfMeasure: { id: string; code: string; name: string } | null
  hsnCode: string | null
  gstRate: number | null
  openingQuantity: number | null
  openingRate: number | null
  reorderLevel: number | null
  barcode: string | null
  trackBatch: boolean
  trackExpiry: boolean
}

export interface DevStockItemsResponse {
  items: DevStockItem[]
  total: number
  page: number
  limit: number
}
