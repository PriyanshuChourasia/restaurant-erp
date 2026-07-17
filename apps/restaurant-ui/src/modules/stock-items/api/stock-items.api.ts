import { apiClient } from '@/lib/axios-client'

export interface StockItemRow {
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

export interface StockItemsResponse {
  items: StockItemRow[]
  total: number
  page: number
  limit: number
}

export async function getStockItems(params?: {
  page?: number
  limit?: number
  search?: string
  group?: string
  category?: string
}) {
  const { data } = await apiClient.get<StockItemsResponse>('/stock-items', { params })
  return data
}
