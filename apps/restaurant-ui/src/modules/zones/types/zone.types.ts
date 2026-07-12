import type { Table as TableType } from '../../tables/types/table.types'

export type { TableType }

export interface Zone {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateZoneRequest {
  name: string
  description?: string
  isActive?: boolean
}

export type UpdateZoneRequest = Partial<CreateZoneRequest>
