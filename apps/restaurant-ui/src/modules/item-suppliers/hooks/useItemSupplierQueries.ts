import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getItemSuppliers,
  getSupplierItems,
  createItemSupplier,
  updateItemSupplier,
  deleteItemSupplier,
  setPreferredSupplier,
} from '../api/item-suppliers.api'

export const itemSupplierKeys = {
  all: ['item-suppliers'] as const,
  byItem: (itemId: string) => [...itemSupplierKeys.all, 'item', itemId] as const,
  bySupplier: (supplierId: string) => [...itemSupplierKeys.all, 'supplier', supplierId] as const,
}

export function useItemSuppliers(itemId: string) {
  return useQuery({
    queryKey: itemSupplierKeys.byItem(itemId),
    queryFn: () => getItemSuppliers(itemId),
    enabled: !!itemId,
  })
}

export function useSupplierItems(supplierId: string) {
  return useQuery({
    queryKey: itemSupplierKeys.bySupplier(supplierId),
    queryFn: () => getSupplierItems(supplierId),
    enabled: !!supplierId,
  })
}

export function useCreateItemSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createItemSupplier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemSupplierKeys.byItem(data.itemId) })
    },
  })
}

export function useUpdateItemSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateItemSupplier>[1] }) =>
      updateItemSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemSupplierKeys.all })
    },
  })
}

export function useDeleteItemSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteItemSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemSupplierKeys.all })
    },
  })
}

export function useSetPreferredSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, supplierId }: { itemId: string; supplierId: string }) =>
      setPreferredSupplier(itemId, supplierId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemSupplierKeys.byItem(data.itemId) })
    },
  })
}
