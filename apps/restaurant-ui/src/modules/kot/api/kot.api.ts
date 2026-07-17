import { apiClient } from '@/lib/axios-client'
import type { Kot, CreateKotPayload, KotListResponse } from '../types'

export async function getActiveKots(station?: string) {
  const { data } = await apiClient.get<Kot[]>('/kots/active', { params: station ? { station } : {} })
  return data
}

export async function getAllKots(params?: { page?: number; limit?: number; status?: string; station?: string }) {
  const { data } = await apiClient.get<KotListResponse>('/kots', { params })
  return data
}

export async function getKotById(id: string) {
  const { data } = await apiClient.get<Kot>(`/kots/${id}`)
  return data
}

export async function createKot(payload: CreateKotPayload) {
  const { data } = await apiClient.post<Kot>('/kots', payload)
  return data
}

export async function updateKotStatus(id: string, status: string, preparedBy?: string) {
  const { data } = await apiClient.patch<Kot>(`/kots/${id}/status`, { status, preparedBy })
  return data
}

export async function updateKotItemStatus(kotId: string, itemId: string, status: string, preparedBy?: string) {
  const { data } = await apiClient.patch<Kot>(`/kots/${kotId}/items/${itemId}/status`, { status, preparedBy })
  return data
}

export async function updateKotItemAvailability(kotId: string, itemId: string, isUnavailable: boolean, note?: string) {
  const { data } = await apiClient.patch<Kot>(`/kots/${kotId}/items/${itemId}/availability`, { isUnavailable, note })
  return data
}
