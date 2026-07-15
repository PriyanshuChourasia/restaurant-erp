import { apiClient } from '@/lib/axios-client'

export interface ItemSupplier {
  id: string
  itemId: string
  supplierId: string
  supplierSku: string | null
  unitPrice: number
  unitId: string | null
  leadTimeDays: number
  isPreferred: boolean
  minOrderQty: number
  lastPurchaseDate: string | null
  lastPurchasePrice: number
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  supplier?: { id: string; name: string; email: string; phone: string | null; gstin: string | null }
  unit?: { id: string; code: string; name: string }
}

export async function getItemSuppliers(itemId: string): Promise<ItemSupplier[]> {
  const { data } = await apiClient.get(`/item-suppliers/item/${itemId}`)
  return data as ItemSupplier[]
}

export async function getSupplierItems(supplierId: string): Promise<ItemSupplier[]> {
  const { data } = await apiClient.get(`/item-suppliers/supplier/${supplierId}`)
  return data as ItemSupplier[]
}

export async function createItemSupplier(payload: {
  itemId: string
  supplierId: string
  supplierSku?: string
  unitPrice: number
  unitId?: string
  leadTimeDays?: number
  isPreferred?: boolean
  minOrderQty?: number
  notes?: string
}): Promise<ItemSupplier> {
  const { data } = await apiClient.post('/item-suppliers', payload)
  return data as ItemSupplier
}

export async function updateItemSupplier(
  id: string,
  payload: Partial<{
    supplierSku: string
    unitPrice: number
    unitId: string
    leadTimeDays: number
    isPreferred: boolean
    minOrderQty: number
    isActive: boolean
    notes: string
  }>,
): Promise<ItemSupplier> {
  const { data } = await apiClient.patch(`/item-suppliers/${id}`, payload)
  return data as ItemSupplier
}

export async function deleteItemSupplier(id: string): Promise<void> {
  await apiClient.delete(`/item-suppliers/${id}`)
}

export async function setPreferredSupplier(itemId: string, supplierId: string): Promise<ItemSupplier> {
  const { data } = await apiClient.post(`/item-suppliers/set-preferred/${itemId}/${supplierId}`)
  return data as ItemSupplier
}
