import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInventory,
  getLowStock,
  getInventoryByItem,
  setOpeningBalance,
  adjustStock,
  getStockMovements,
  createStockCount,
  submitStockCountLines,
  completeStockCount,
  getStockCounts,
  getStockCount,
  getAllBatches,
  getItemBatches,
  getNearExpiryBatches,
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

// ── Stock Count hooks (Module 7) ───────────────────────────────────

export const stockCountKeys = {
  all: ['stock-counts'] as const,
  lists: () => [...stockCountKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...stockCountKeys.lists(), params] as const,
  details: () => [...stockCountKeys.all, 'detail'] as const,
  detail: (id: string) => [...stockCountKeys.details(), id] as const,
}

export function useStockCounts(params?: { page?: number; limit?: number; storageUnitId?: string }) {
  return useQuery({
    queryKey: stockCountKeys.list(params),
    queryFn: () => getStockCounts(params),
  })
}

export function useStockCount(id: string) {
  return useQuery({
    queryKey: stockCountKeys.detail(id),
    queryFn: () => getStockCount(id),
    enabled: !!id,
  })
}

export function useCreateStockCount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storageUnitId, itemIds, notes }: { storageUnitId: string; itemIds: string[]; notes?: string }) =>
      createStockCount(storageUnitId, itemIds, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useSubmitStockCountLines() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stockCountId, lines }: { stockCountId: string; lines: { lineId: string; countedQuantity: number; notes?: string }[] }) =>
      submitStockCountLines(stockCountId, lines),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(variables.stockCountId) })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
    },
  })
}

// ── Batch Tracking hooks ───────────────────────────────────────────

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...batchKeys.lists(), params] as const,
  nearExpiry: () => [...batchKeys.all, 'near-expiry'] as const,
  byItem: (itemId: string) => [...batchKeys.all, 'item', itemId] as const,
}

export function useAllBatches() {
  return useQuery({
    queryKey: batchKeys.list(),
    queryFn: () => getAllBatches(),
  })
}

export function useItemBatches(itemId: string, status?: string) {
  return useQuery({
    queryKey: batchKeys.byItem(itemId),
    queryFn: () => getItemBatches(itemId, status),
    enabled: !!itemId,
  })
}

export function useNearExpiryBatches(days = 7) {
  return useQuery({
    queryKey: batchKeys.nearExpiry(),
    queryFn: () => getNearExpiryBatches(days),
  })
}

export function useCompleteStockCount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stockCountId: string) => completeStockCount(stockCountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
