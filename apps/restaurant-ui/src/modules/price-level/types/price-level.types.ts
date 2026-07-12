// ---- Response Types ----

export interface PriceLevel {
  id: string
  name: string
  code: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PricingGridRow {
  itemId: string
  itemName: string
  sku: string
  hsnCode: string
  gstRate: number
  unit: string
  categoryId: string | null
  categoryName: string | null
  basePrice: number
  overridePrice: number | null
  effectivePrice: number
  isOverridden: boolean
}

// ---- Request Types ----

export interface CreatePriceLevelRequest {
  name: string
  code: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface UpdatePriceLevelRequest {
  name?: string
  code?: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface BulkPricingEntry {
  itemId: string
  price: number
}

export interface SaveBulkPricingRequest {
  items: BulkPricingEntry[]
}

// ---- Query Types ----

export interface PriceLevelListParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
