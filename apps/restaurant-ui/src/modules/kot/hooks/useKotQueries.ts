import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActiveKots, getAllKots, getKotById, createKot, updateKotStatus, updateKotItemStatus } from '../api/kot.api'
import type { CreateKotPayload } from '../types'

export function useActiveKots(station?: string) {
  return useQuery({
    queryKey: ['kots', 'active', station],
    queryFn: () => getActiveKots(station),
    refetchInterval: 10000,
  })
}

export function useAllKots(params?: { page?: number; limit?: number; status?: string; station?: string }) {
  return useQuery({
    queryKey: ['kots', 'list', params],
    queryFn: () => getAllKots(params),
  })
}

export function useKotById(id: string) {
  return useQuery({
    queryKey: ['kots', id],
    queryFn: () => getKotById(id),
    enabled: !!id,
  })
}

export function useCreateKot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateKotPayload) => createKot(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kots'] })
    },
  })
}

export function useUpdateKotStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, preparedBy }: { id: string; status: string; preparedBy?: string }) =>
      updateKotStatus(id, status, preparedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kots'] })
    },
  })
}

export function useUpdateKotItemStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kotId, itemId, status, preparedBy }: { kotId: string; itemId: string; status: string; preparedBy?: string }) =>
      updateKotItemStatus(kotId, itemId, status, preparedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kots'] })
    },
  })
}
