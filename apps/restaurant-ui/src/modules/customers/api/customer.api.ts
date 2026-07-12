import { apiClient } from '@/lib/axios-client'
import type {
  Customer,
  CustomerSearchResult,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListParams,
  PaginatedResponse,
} from '../types/customer.types'

const BASE_URL = '/customers'

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<PaginatedResponse<Customer>> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(BASE_URL, { params })
  return data
}

export async function searchCustomers(
  q: string,
  limit = 10,
): Promise<CustomerSearchResult[]> {
  if (!q || q.length < 2) return []
  const { data } = await apiClient.get<CustomerSearchResult[]>(`${BASE_URL}/search`, {
    params: { q, limit },
  })
  return data
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`${BASE_URL}/${id}`)
  return data
}

export async function createCustomer(
  payload: CreateCustomerRequest,
): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(BASE_URL, payload)
  return data
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerRequest,
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

export async function restoreCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`${BASE_URL}/${id}/restore`)
  return data
}
