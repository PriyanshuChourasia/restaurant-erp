export interface DevUser {
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

export interface DevUserListResponse {
  data: DevUser[]
  total: number
  page: number
  limit: number
}

export interface DevCreateUserPayload {
  name: string
  email: string
  password: string
  phone?: string
  roleId?: string
}

export type DevUpdateUserPayload = Partial<
  Pick<DevUser, 'name' | 'email' | 'phone' | 'roleId' | 'isActive'>
>
