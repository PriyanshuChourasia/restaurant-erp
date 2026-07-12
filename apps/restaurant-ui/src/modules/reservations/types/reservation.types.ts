export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
export type ReservationSource = 'online' | 'phone' | 'walk_in'

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string | null
  partySize: number
  zoneId: string | null
  tableId: string | null
  table: { id: string; label: string } | null
  scheduledFor: string
  durationMinutes: number
  status: ReservationStatus
  source: ReservationSource
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReservationRequest {
  customerName: string
  customerPhone?: string
  partySize: number
  zoneId?: string
  tableId?: string
  scheduledFor: string
  durationMinutes?: number
  source?: string
  status?: string
  notes?: string
}

export type UpdateReservationRequest = Partial<CreateReservationRequest>

export interface TableBrief {
  id: string
  label: string
  status: string
}

export interface ZoneBrief {
  id: string
  name: string
}
