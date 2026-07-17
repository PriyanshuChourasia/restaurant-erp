export type KotStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'

export type KotStation = 'main_kitchen' | 'tandoor' | 'beverages' | 'desserts' | 'snacks'

export interface KotItem {
  id: string
  itemId: string
  itemName: string
  quantity: number
  instructions: string | null
  status: KotStatus
  isUnavailable: boolean
  unavailableNote: string | null
}

export interface Kot {
  id: string
  kotNumber: string
  orderId: string | null
  tableIds: string[] | null
  status: KotStatus
  station: KotStation
  notes: string | null
  preparedBy: string | null
  startedAt: string | null
  completedAt: string | null
  servedAt: string | null
  items: KotItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateKotPayload {
  orderId?: string
  tableIds?: string[]
  station: KotStation
  notes?: string
  items: Array<{
    itemId: string
    itemName: string
    quantity: number
    instructions?: string
  }>
}

export interface KotListResponse {
  data: Kot[]
  total: number
  page: number
  limit: number
}

export const STATIONS: KotStation[] = ['main_kitchen', 'tandoor', 'beverages', 'desserts', 'snacks']

export const STATION_LABELS: Record<KotStation, string> = {
  main_kitchen: 'Main Kitchen',
  tandoor: 'Tandoor',
  beverages: 'Beverages',
  desserts: 'Desserts',
  snacks: 'Snacks',
}

export const STATION_ICONS: Record<KotStation, string> = {
  main_kitchen: '🍳',
  tandoor: '🔥',
  beverages: '🥤',
  desserts: '🍰',
  snacks: '🍿',
}

export const STATUS_COLORS: Record<KotStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  preparing: 'bg-blue-100 text-blue-800 border-blue-300',
  ready: 'bg-green-100 text-green-800 border-green-300',
  served: 'bg-gray-100 text-gray-500 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

export const STATUS_LABELS: Record<KotStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}
