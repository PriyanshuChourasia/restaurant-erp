import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as customerApi from '../api/customer.api'
import type { CreateCustomerRequest, UpdateCustomerRequest, CustomerListParams } from '../types/customer.types'

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerListParams) => [...customerKeys.lists(), filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  search: (q: string) => [...customerKeys.all, 'search', q] as const,
}

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.getCustomers(params),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getCustomer(id),
    enabled: !!id,
  })
}

export function useCustomerSearch(q: string) {
  return useQuery({
    queryKey: customerKeys.search(q),
    queryFn: () => customerApi.searchCustomers(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerRequest) => customerApi.createCustomer(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerApi.updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
