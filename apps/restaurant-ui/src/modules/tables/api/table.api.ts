import { apiClient } from '@/lib/axios-client'
import type { Table, CreateTableRequest, UpdateTableRequest, TableStatus } from '../types/table.types'

const TABLES_URL = '/tables'
const ZONES_URL = '/zones'

// ───── Tables ─────

export async function getTables(unassigned?: boolean, zoneId?: string): Promise<Table[]> {
  const params: Record<string, string> = {}
  if (unassigned) params.unassigned = 'true'
  if (zoneId) params.zoneId = zoneId
  const { data } = await apiClient.get<Table[]>(TABLES_URL, { params })
  return data
}

export async function getTable(id: string): Promise<Table> {
  const { data } = await apiClient.get<Table>(`${TABLES_URL}/${id}`)
  return data
}

export async function createTable(payload: CreateTableRequest): Promise<Table> {
  const { data } = await apiClient.post<Table>(TABLES_URL, payload)
  return data
}

export async function updateTable(id: string, payload: UpdateTableRequest): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}`, payload)
  return data
}

export async function updateTableStatus(id: string, status: TableStatus): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}/status`, { status })
  return data
}

export async function updateTablePosition(id: string, posX: number, posY: number): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}/position`, { posX, posY })
  return data
}

export async function assignTableToZone(id: string, zoneId: string | null): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}/zone`, { zoneId })
  return data
}

export async function deleteTable(id: string): Promise<void> {
  await apiClient.delete(`${TABLES_URL}/${id}`)
}

// ───── Zone helper (for assignment dropdown) ─────

export async function getZonesBrief(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await apiClient.get<Array<{ id: string; name: string }>>(ZONES_URL)
  return data
}
