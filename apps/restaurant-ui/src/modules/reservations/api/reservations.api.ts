import { apiClient } from '@/lib/axios-client'
import type { Reservation, CreateReservationRequest, UpdateReservationRequest } from '../types/reservation.types'

const RESERVATIONS_URL = '/reservations'

export async function getReservations(params?: {
  dateFrom?: string
  dateTo?: string
  status?: string
}): Promise<Reservation[]> {
  const { data } = await apiClient.get<Reservation[]>(RESERVATIONS_URL, { params })
  return data
}

export async function getReservation(id: string): Promise<Reservation> {
  const { data } = await apiClient.get<Reservation>(`${RESERVATIONS_URL}/${id}`)
  return data
}

export async function getTableConflict(
  tableId: string,
  withinMinutes = 120,
): Promise<Reservation | null> {
  const { data } = await apiClient.get<Reservation | null>(
    `${RESERVATIONS_URL}/table/${tableId}/conflict`,
    { params: { withinMinutes } },
  )
  return data
}

export async function createReservation(payload: CreateReservationRequest): Promise<Reservation> {
  const { data } = await apiClient.post<Reservation>(RESERVATIONS_URL, payload)
  return data
}

export async function updateReservation(
  id: string,
  payload: UpdateReservationRequest,
): Promise<Reservation> {
  const { data } = await apiClient.patch<Reservation>(`${RESERVATIONS_URL}/${id}`, payload)
  return data
}

export async function updateReservationStatus(
  id: string,
  status: string,
): Promise<Reservation> {
  const { data } = await apiClient.patch<Reservation>(
    `${RESERVATIONS_URL}/${id}/status`,
    { status },
  )
  return data
}

export async function seatReservation(
  id: string,
  tableId: string,
): Promise<Reservation> {
  const { data } = await apiClient.post<Reservation>(
    `${RESERVATIONS_URL}/${id}/seat`,
    { tableId },
  )
  return data
}

export async function deleteReservation(id: string): Promise<void> {
  await apiClient.delete(`${RESERVATIONS_URL}/${id}`)
}
