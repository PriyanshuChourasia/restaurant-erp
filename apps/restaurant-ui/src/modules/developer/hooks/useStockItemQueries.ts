import { useQuery } from '@tanstack/react-query'
import { getDevStockItems } from '../api/stock-item.api'

export const devStockItemKeys = {
  all: ['dev-stock-items'] as const,
  lists: () => [...devStockItemKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...devStockItemKeys.lists(), params] as const,
}

export function useDevStockItems(params?: {
  page?: number
  limit?: number
  search?: string
  group?: string
  category?: string
}) {
  return useQuery({
    queryKey: devStockItemKeys.list(params),
    queryFn: () => getDevStockItems(params),
  })
}
