import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInventory,
  getLowStock,
  getInventoryByItem,
  setOpeningBalance,
  adjustStock,
  getStockMovements,
} from '../api/inventory.api'

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...inventoryKeys.lists(), params] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (itemId: string) => [...inventoryKeys.details(), itemId] as const,
  lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
  movements: (itemId: string) => [...inventoryKeys.all, 'movements', itemId] as const,
}

export function useInventory(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => getInventory(params),
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => getLowStock(),
  })
}

export function useInventoryByItem(itemId: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(itemId),
    queryFn: () => getInventoryByItem(itemId),
    enabled: !!itemId,
  })
}

export function useStockMovements(itemId: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: inventoryKeys.movements(itemId),
    queryFn: () => getStockMovements(itemId, page, limit),
    enabled: !!itemId,
  })
}

export function useSetOpeningBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quantity, unitCost }: { itemId: string; quantity: number; unitCost: number }) =>
      setOpeningBalance(itemId, quantity, unitCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, type, quantity, notes, reference }: { itemId: string; type: string; quantity: number; notes?: string; reference?: string }) =>
      adjustStock(itemId, type, quantity, notes, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
