import { apiClient } from '@/lib/axios-client'
import type {
  DevUser,
  DevUserListResponse,
  DevCreateUserPayload,
  DevUpdateUserPayload,
} from '../types/user.types'

const BASE = '/users'

export async function getDevUsers(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<DevUserListResponse> {
  const { data } = await apiClient.get<DevUserListResponse>(BASE, { params })
  return data
}

export async function getDevUser(id: string): Promise<DevUser> {
  const { data } = await apiClient.get<DevUser>(`${BASE}/${id}`)
  return data
}

export async function createDevUser(payload: DevCreateUserPayload): Promise<DevUser> {
  const { data } = await apiClient.post<DevUser>(BASE, payload)
  return data
}

export async function updateDevUser(
  id: string,
  payload: DevUpdateUserPayload,
): Promise<DevUser> {
  const { data } = await apiClient.patch<DevUser>(`${BASE}/${id}`, payload)
  return data
}

export async function deleteDevUser(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export async function restoreDevUser(id: string): Promise<void> {
  await apiClient.post(`${BASE}/${id}/restore`)
}
