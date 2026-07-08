import { apiClient } from '@/lib/axios-client'

export interface InventoryItem {
  id: string
  itemId: string
  openingBalance: number
  currentStock: number
  minStockLevel: number
  unitCost: number
  status: string
  item: { id: string; name: string; sku: string; unit: string; category?: { name: string } }
}

export interface StockMovement {
  id: string
  itemId: string
  type: string
  quantity: number
  balanceBefore: number
  balanceAfter: number
  reference: string | null
  notes: string | null
  createdAt: string
}

export async function getInventory(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  const { data } = await apiClient.get('/inventory', { params })
  return data
}

export async function getLowStock() {
  const { data } = await apiClient.get('/inventory/low-stock')
  return data
}

export async function getInventoryByItem(itemId: string) {
  const { data } = await apiClient.get(`/inventory/${itemId}`)
  return data
}

export async function setOpeningBalance(itemId: string, quantity: number, unitCost: number) {
  const { data } = await apiClient.post(`/inventory/${itemId}/opening-balance`, { quantity, unitCost })
  return data
}

export async function adjustStock(itemId: string, type: string, quantity: number, notes?: string, reference?: string) {
  const { data } = await apiClient.post(`/inventory/${itemId}/adjust`, { type, quantity, notes, reference })
  return data
}

export async function getStockMovements(itemId: string, page?: number, limit?: number) {
  const { data } = await apiClient.get(`/inventory/${itemId}/movements`, { params: { page, limit } })
  return data
}
