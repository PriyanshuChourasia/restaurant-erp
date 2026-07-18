import { apiClient } from '@/lib/axios-client'

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: { id: string; name: string } | null
  roleId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface StaffResponse {
  data: StaffMember[]
  total: number
  page: number
  limit: number
}

export async function getStaff(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await apiClient.get<StaffResponse>('/users', { params })
  return data
}

export async function getStaffMember(id: string) {
  const { data } = await apiClient.get<StaffMember>(`/users/${id}`)
  return data
}

export async function createStaff(payload: {
  name: string
  email: string
  password: string
  phone?: string
  roleId?: string
}) {
  const { data } = await apiClient.post<StaffMember>('/users', payload)
  return data
}

export async function updateStaff(id: string, payload: Partial<{
  name: string
  email: string
  phone: string
  roleId: string
  isActive: boolean
}>) {
  const { data } = await apiClient.patch<StaffMember>(`/users/${id}`, payload)
  return data
}

export async function deleteStaff(id: string) {
  await apiClient.delete(`/users/${id}`)
}

export async function restoreStaff(id: string) {
  await apiClient.post(`/users/${id}/restore`)
}

export interface Role {
  id: string
  name: string
}

export async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/roles')
  return data
}
