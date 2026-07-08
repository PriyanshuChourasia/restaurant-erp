export type UserRole = 'admin' | 'manager' | 'chef' | 'server' | 'host' | 'bartender'

export type UserStatus = 'active' | 'inactive' | 'on_leave'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  department: string
  shift: 'morning' | 'evening' | 'night'
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface ProfileFormValues {
  name: string
  email: string
  phone: string
  role: UserRole
  department: string
  shift: 'morning' | 'evening' | 'night'
  bio: string
}
