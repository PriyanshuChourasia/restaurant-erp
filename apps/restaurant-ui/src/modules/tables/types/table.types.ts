export interface Table {
  id: string
  zoneId: string | null
  label: string
  capacity: number | null
  category: 'online' | 'walk_in' | 'flexible'
  status: 'available' | 'booked' | 'occupied'
  posX: number | null
  posY: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TableStatus = 'available' | 'booked' | 'occupied'
export type TableCategory = 'online' | 'walk_in' | 'flexible'

export interface CreateTableRequest {
  zoneId?: string
  label: string
  capacity?: number
  category?: TableCategory
  status?: TableStatus
  posX?: number
  posY?: number
  isActive?: boolean
}

export type UpdateTableRequest = Partial<CreateTableRequest>

export interface ZoneBrief {
  id: string
  name: string
}
