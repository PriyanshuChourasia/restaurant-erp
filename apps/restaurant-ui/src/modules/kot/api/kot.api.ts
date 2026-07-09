import { apiClient } from '@/lib/axios-client'

export interface KotItem {
  id: string
  itemId: string
  itemName: string
  quantity: number
  instructions: string | null
  status: string
}

export interface Kot {
  id: string
  kotNumber: string
  orderId: string | null
  tableNumbers: string[] | null
  status: string
  station: string
  notes: string | null
  items: KotItem[]
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  servedAt: string | null
}

export async function getActiveKots(station?: string) {
  const { data } = await apiClient.get<Kot[]>('/kots/active', { params: station ? { station } : {} })
  return data
}

export async function getAllKots(params?: { page?: number; limit?: number; status?: string; station?: string }) {
  const { data } = await apiClient.get('/kots', { params })
  return data
}

export async function createKot(payload: any) {
  const { data } = await apiClient.post('/kots', payload)
  return data
}

export async function updateKotStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/kots/${id}/status`, { status })
  return data
}

export async function updateKotItemStatus(kotId: string, itemId: string, status: string) {
  const { data } = await apiClient.patch(`/kots/${kotId}/items/${itemId}/status`, { status })
  return data
}
