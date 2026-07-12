import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as reservationsApi from '../api/reservations.api'
import type { CreateReservationRequest, UpdateReservationRequest } from '../types/reservation.types'

export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (params?: Record<string, string>) => [...reservationKeys.lists(), params] as const,
  detail: (id: string) => [...reservationKeys.all, 'detail', id] as const,
}

export function useReservations(params?: {
  dateFrom?: string
  dateTo?: string
  status?: string
}) {
  const queryKey = params?.dateFrom || params?.dateTo || params?.status
    ? reservationKeys.list(params as Record<string, string>)
    : reservationKeys.lists()

  return useQuery({
    queryKey,
    queryFn: () => reservationsApi.getReservations(params),
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id),
    queryFn: () => reservationsApi.getReservation(id),
    enabled: !!id,
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateReservationRequest) => reservationsApi.createReservation(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.lists() }),
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationRequest }) =>
      reservationsApi.updateReservation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.lists() }),
  })
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reservationsApi.updateReservationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.lists() }),
  })
}

export function useSeatReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tableId }: { id: string; tableId: string }) =>
      reservationsApi.seatReservation(id, tableId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.lists() }),
  })
}

export function useDeleteReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reservationsApi.deleteReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.lists() }),
  })
}
