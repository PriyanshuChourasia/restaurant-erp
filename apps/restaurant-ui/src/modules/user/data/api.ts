import { apiClient } from '@/lib/axios-client'
import type { User, ProfileFormValues } from './types'

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get('/auth/profile')
  return data
}

export async function updateProfile(userId: string, data: ProfileFormValues): Promise<User> {
  const { data: updated } = await apiClient.patch(`/users/${userId}`, {
    name: data.name,
    email: data.email,
    phone: data.phone,
  })
  return updated
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  // Backend password change endpoint - POST /auth/change-password
  await apiClient.post('/auth/change-password', data)
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url || data.avatarUrl
}
