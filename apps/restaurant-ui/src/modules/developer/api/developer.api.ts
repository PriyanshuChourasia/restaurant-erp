import { apiClient } from '@/lib/axios-client'

const BASE = '/developer'

export interface DevTable {
  tableName: string
  tableType: string
  comment: string
  columnCount: number
}

export interface DevColumn {
  columnName: string
  dataType: string
  isNullable: string
  columnDefault: string | null
  maxLength: number | null
  position: number
}

export interface DevTableData {
  data: Record<string, any>[]
  total: number
  limit: number
  offset: number
}

export interface ModuleSchema {
  module: string
  entities: string[]
  description: string
}

export async function getDevTables(): Promise<DevTable[]> {
  const { data } = await apiClient.get<DevTable[]>(`${BASE}/tables`)
  return data
}

export async function getDevTableData(
  tableName: string,
  params?: { limit?: number; offset?: number },
): Promise<DevTableData> {
  const { data } = await apiClient.get<DevTableData>(`${BASE}/tables/${tableName}`, { params })
  return data
}

export async function getDevTableColumns(tableName: string): Promise<DevColumn[]> {
  const { data } = await apiClient.get<DevColumn[]>(`${BASE}/tables/${tableName}/columns`)
  return data
}

export async function getModuleSchema(): Promise<ModuleSchema[]> {
  const { data } = await apiClient.get<ModuleSchema[]>(`${BASE}/schema`)
  return data
}
