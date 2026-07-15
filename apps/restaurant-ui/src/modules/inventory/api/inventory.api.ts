import { apiClient } from '@/lib/axios-client'

import type { StockBatch } from '../types/inventory.types'

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

export interface OpeningStockInfo {
  id: string
  itemId: string
  storageUnitId: string
  quantity: number
  unitCost: number
  asOfDate: string
  currentStock: number
  createdAt: string
  movementReference: string | null
}

export async function getOpeningStock(itemId: string, storageUnitId?: string) {
  const { data } = await apiClient.get(`/inventory/${itemId}/opening-stock`, { params: { storageUnitId } })
  return data as OpeningStockInfo | null
}

export async function declareOpeningStock(
  itemId: string,
  storageUnitId: string,
  quantity: number,
  unitCost: number,
  asOfDate?: string,
) {
  const { data } = await apiClient.post(`/inventory/${itemId}/opening-stock`, {
    storageUnitId, quantity, unitCost, asOfDate,
  })
  return data
}

// ── Stock Counts (Module 7) ────────────────────────────────────────

export interface StockCountLine {
  id: string
  itemId: string
  systemQuantity: number
  countedQuantity: number | null
  variance: number | null
  notes: string | null
  item?: { id: string; name: string; sku: string; unit: string }
}

export interface StockCount {
  id: string
  storageUnitId: string
  countDate: string
  status: 'draft' | 'completed'
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  lines: StockCountLine[]
  storageUnit?: { id: string; name: string; code: string }
}

export async function createStockCount(storageUnitId: string, itemIds: string[], notes?: string) {
  const { data } = await apiClient.post('/inventory/stock-counts', { storageUnitId, itemIds, notes })
  return data as StockCount
}

export async function submitStockCountLines(
  stockCountId: string,
  lines: { lineId: string; countedQuantity: number; notes?: string }[],
) {
  const { data } = await apiClient.post(`/inventory/stock-counts/${stockCountId}/submit`, { lines })
  return data as StockCount
}

export async function completeStockCount(stockCountId: string) {
  const { data } = await apiClient.post(`/inventory/stock-counts/${stockCountId}/complete`, {})
  return data as StockCount
}

export async function getStockCounts(params?: { page?: number; limit?: number; storageUnitId?: string }) {
  const { data } = await apiClient.get('/inventory/stock-counts', { params })
  return data
}

export async function getStockCount(id: string) {
  const { data } = await apiClient.get(`/inventory/stock-counts/${id}`)
  return data as StockCount
}

// ── Batch Tracking ──────────────────────────────────────────────────

export interface NearExpiryBatch {
  id: string
  itemId: string
  storageUnitId: string
  batchNumber: string
  quantityReceived: number
  quantityRemaining: number
  unitCost: number
  receivedDate: string
  expiryDate: string | null
  status: string
  item: { id: string; name: string; sku: string; unit: { code: string; name: string }; category?: { name: string } }
  storageUnit?: { id: string; name: string; code: string }
}

export async function getAllBatches(): Promise<StockBatch[]> {
  const { data } = await apiClient.get('/inventory/batches/all')
  return data as StockBatch[]
}

export async function getItemBatches(itemId: string, status?: string): Promise<StockBatch[]> {
  const { data } = await apiClient.get(`/inventory/${itemId}/batches`, { params: { status } })
  return data as StockBatch[]
}

export async function getNearExpiryBatches(days = 7): Promise<NearExpiryBatch[]> {
  const { data } = await apiClient.get('/inventory/near-expiry', { params: { days } })
  return data as NearExpiryBatch[]
}
