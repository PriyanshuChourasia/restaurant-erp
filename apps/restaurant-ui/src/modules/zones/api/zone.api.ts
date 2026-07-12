import { apiClient } from '@/lib/axios-client'
import type { Zone, CreateZoneRequest, UpdateZoneRequest } from '../types/zone.types'
import type { Table, UpdateTableRequest, TableStatus } from '../../tables/types/table.types'

const ZONES_URL = '/zones'
const TABLES_URL = '/tables'

// ───── Zones ─────

export async function getZones(includeInactive = false): Promise<Zone[]> {
  const { data } = await apiClient.get<Zone[]>(ZONES_URL, {
    params: includeInactive ? { includeInactive: 'true' } : {},
  })
  return data
}

export async function getZone(id: string): Promise<Zone> {
  const { data } = await apiClient.get<Zone>(`${ZONES_URL}/${id}`)
  return data
}

export async function createZone(payload: CreateZoneRequest): Promise<Zone> {
  const { data } = await apiClient.post<Zone>(ZONES_URL, payload)
  return data
}

export async function updateZone(id: string, payload: UpdateZoneRequest): Promise<Zone> {
  const { data } = await apiClient.patch<Zone>(`${ZONES_URL}/${id}`, payload)
  return data
}

export async function deleteZone(id: string): Promise<void> {
  await apiClient.delete(`${ZONES_URL}/${id}`)
}

// ───── Tables (within a zone) ─────

export async function getZoneTables(zoneId: string): Promise<Table[]> {
  const { data } = await apiClient.get<Table[]>(`${ZONES_URL}/${zoneId}/tables`)
  return data
}

export async function getAllTables(): Promise<Table[]> {
  const { data } = await apiClient.get<Table[]>(TABLES_URL)
  return data
}

export async function getUnassignedTables(): Promise<Table[]> {
  const { data } = await apiClient.get<Table[]>(TABLES_URL, {
    params: { unassigned: 'true' },
  })
  return data
}

export async function updateTable(
  id: string,
  payload: UpdateTableRequest,
): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}`, payload)
  return data
}

export async function updateTableStatus(
  id: string,
  status: TableStatus,
): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}/status`, { status })
  return data
}

export async function assignTableToZone(
  tableId: string,
  zoneId: string | null,
): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${tableId}/zone`, { zoneId })
  return data
}

export async function updateTablePosition(
  id: string,
  posX: number,
  posY: number,
): Promise<Table> {
  const { data } = await apiClient.patch<Table>(`${TABLES_URL}/${id}/position`, { posX, posY })
  return data
}

export async function deleteTable(id: string): Promise<void> {
  await apiClient.delete(`${TABLES_URL}/${id}`)
}
