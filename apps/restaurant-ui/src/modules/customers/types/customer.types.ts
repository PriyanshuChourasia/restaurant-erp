export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  gstin: string | null
  customerType: 'regular' | 'corporate' | 'staff'
  priceLevelId: string | null
  priceLevel?: { id: string; name: string; code: string } | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerSearchResult {
  id: string
  name: string
  phone: string
  customerType: string
  priceLevelId: string | null
}

export interface CreateCustomerRequest {
  name: string
  phone: string
  email?: string
  gstin?: string
  customerType?: string
  priceLevelId?: string
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>

export interface CustomerListParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  customerType?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
