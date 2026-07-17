import { useQuery } from '@tanstack/react-query'
import { getDevTables, getDevTableData, getDevTableColumns } from '../api/developer.api'

export function useDevTables() {
  return useQuery({
    queryKey: ['dev-tables'],
    queryFn: getDevTables,
  })
}

export function useDevTableData(tableName: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['dev-table-data', tableName, params],
    queryFn: () => getDevTableData(tableName, params),
    enabled: !!tableName,
  })
}

export function useDevTableColumns(tableName: string) {
  return useQuery({
    queryKey: ['dev-table-columns', tableName],
    queryFn: () => getDevTableColumns(tableName),
    enabled: !!tableName,
  })
}
