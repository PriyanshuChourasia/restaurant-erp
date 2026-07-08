import type { User, ProfileFormValues } from './types'

// Simulated API — will be connected to the backend later
const MOCK_USER: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@restaurant.com',
  phone: '+1 (555) 000-0000',
  role: 'admin',
  status: 'active',
  department: 'Management',
  shift: 'morning',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2026-07-08T00:00:00Z',
}

export async function getCurrentUser(): Promise<User> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 100))
  return MOCK_USER
}

export async function updateProfile(data: ProfileFormValues): Promise<User> {
  await new Promise((r) => setTimeout(r, 500))
  return {
    ...MOCK_USER,
    ...data,
    updatedAt: new Date().toISOString(),
  }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
  // Will connect to backend later
  console.log('Password changed', data)
}

export async function uploadAvatar(file: File): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000))
  // Will connect to backend later
  return URL.createObjectURL(file)
}
