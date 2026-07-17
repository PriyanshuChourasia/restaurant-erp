import { apiClient } from '@/lib/axios-client'
import type { DevStockItemsResponse } from '../types/stock-item.types'

export async function getDevStockItems(params?: {
  page?: number
  limit?: number
  search?: string
  group?: string
  category?: string
}): Promise<DevStockItemsResponse> {
  const { data } = await apiClient.get<DevStockItemsResponse>('/stock-items', { params })
  return data
}
