import { apiClient } from '@/lib/axios-client'

export interface UnitBrief {
  id: string
  superKey: number
  symbol: string
  name: string
  description: string | null
  baseUnitId: string | null
  conversionFactor: number
  decimalAllowed: boolean
  isActive: boolean
}

export interface Item {
  id: string
  name: string
  description: string | null
  sku: string
  hsnCode: string
  price: number
  costPrice: number
  gstRate: number
  itemType: 'goods' | 'service'
  isTaxable: boolean
  cessPercent: number
  reverseCharge: boolean
  unitId: string
  unit: UnitBrief
  purchaseUnitId: string | null
  productType: string
  isActive: boolean
  isVeg: boolean
  image: string | null
  categoryId: string | null
  categoryName: string | null
  gstBreakdown: { cgst: number; sgst: number; total: number }
  createdAt: string
  updatedAt: string
}

export interface ItemsResponse {
  items: Item[]
  total: number
  page: number
  limit: number
}

export interface CreateItemRequest {
  name: string
  sku: string
  hsnCode: string
  price: number
  categoryId?: string
  description?: string
  costPrice?: number
  gstRate?: number
  itemType?: 'goods' | 'service'
  isTaxable?: boolean
  cessPercent?: number
  reverseCharge?: boolean
  unitId: string
  purchaseUnitId?: string
  productType?: string
  isVeg?: boolean
  isActive?: boolean
}

export async function getItems(params?: { page?: number; limit?: number; search?: string; categoryId?: string }) {
  const { data } = await apiClient.get<ItemsResponse>('/items', { params })
  return data
}

export async function getItem(id: string) {
  const { data } = await apiClient.get<Item>(`/items/${id}`)
  return data
}

export async function createItem(payload: CreateItemRequest) {
  const { data } = await apiClient.post<Item>('/items', payload)
  return data
}

export async function updateItem(id: string, payload: Partial<CreateItemRequest>) {
  const { data } = await apiClient.patch<Item>(`/items/${id}`, payload)
  return data
}

export async function deleteItem(id: string) {
  await apiClient.delete(`/items/${id}`)
}

export async function restoreItem(id: string) {
  await apiClient.post(`/items/${id}/restore`)
}
