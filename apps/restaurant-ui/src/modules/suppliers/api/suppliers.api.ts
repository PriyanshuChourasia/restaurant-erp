import { apiClient } from '@/lib/axios-client'

export interface Supplier {
  id: string
  name: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  address: string | null
  gstin: string | null
  paymentTerms: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SuppliersResponse {
  data: Supplier[]
  total: number
  page: number
  limit: number
}

export async function getSuppliers(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await apiClient.get<SuppliersResponse>('/suppliers', { params })
  return data
}

export async function getSupplier(id: string) {
  const { data } = await apiClient.get<Supplier>(`/suppliers/${id}`)
  return data
}

export async function createSupplier(payload: Partial<Supplier>) {
  const { data } = await apiClient.post<Supplier>('/suppliers', payload)
  return data
}

export async function updateSupplier(id: string, payload: Partial<Supplier>) {
  const { data } = await apiClient.patch<Supplier>(`/suppliers/${id}`, payload)
  return data
}

export async function deleteSupplier(id: string) {
  await apiClient.delete(`/suppliers/${id}`)
}
