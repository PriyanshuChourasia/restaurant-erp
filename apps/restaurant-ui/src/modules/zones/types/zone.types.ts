import type { Table as TableType } from '../../tables/types/table.types'

export type { TableType }

export interface Zone {
  id: string
  name: string
  description: string | null
  floor: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateZoneRequest {
  name: string
  description?: string
  floor?: number
  isActive?: boolean
}

export type UpdateZoneRequest = Partial<CreateZoneRequest>
