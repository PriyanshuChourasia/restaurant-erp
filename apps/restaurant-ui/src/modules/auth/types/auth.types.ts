export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  roleName?: string
  permissions: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
}

export interface RegisterResponse {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  createdAt: string
}

export interface ProfileResponse {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  roleId: string | null
  role: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}
