import { apiClient } from '@/lib/axios-client'

export interface CostCentre {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CostCentresResponse {
  data: CostCentre[]
  total: number
  page: number
  limit: number
}

export async function getCostCentres(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await apiClient.get<CostCentresResponse>('/cost-centres', { params })
  return data
}

export async function getCostCentre(id: string) {
  const { data } = await apiClient.get<CostCentre>(`/cost-centres/${id}`)
  return data
}

export async function createCostCentre(payload: Partial<CostCentre>) {
  const { data } = await apiClient.post<CostCentre>('/cost-centres', payload)
  return data
}

export async function updateCostCentre(id: string, payload: Partial<CostCentre>) {
  const { data } = await apiClient.patch<CostCentre>(`/cost-centres/${id}`, payload)
  return data
}

export async function deleteCostCentre(id: string) {
  await apiClient.delete(`/cost-centres/${id}`)
}
