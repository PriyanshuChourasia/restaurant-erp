import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as zoneApi from '../api/zone.api'
import type { CreateZoneRequest, UpdateZoneRequest } from '../types/zone.types'
import type { TableStatus } from '../../tables/types/table.types'

export const zoneKeys = {
  all: ['zones'] as const,
  lists: () => [...zoneKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) => [...zoneKeys.lists(), { includeInactive }] as const,
  detail: (id: string) => [...zoneKeys.all, 'detail', id] as const,
  tables: (zoneId: string) => [...zoneKeys.all, 'tables', zoneId] as const,
}

export const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (unassigned?: boolean) => [...tableKeys.lists(), { unassigned }] as const,
  detail: (id: string) => [...tableKeys.all, 'detail', id] as const,
}

export function useZones(includeInactive = false) {
  return useQuery({
    queryKey: zoneKeys.list(includeInactive),
    queryFn: () => zoneApi.getZones(includeInactive),
  })
}

export function useZone(id: string) {
  return useQuery({
    queryKey: zoneKeys.detail(id),
    queryFn: () => zoneApi.getZone(id),
    enabled: !!id,
  })
}

export function useZoneTables(zoneId: string) {
  return useQuery({
    queryKey: zoneKeys.tables(zoneId),
    queryFn: () => zoneApi.getZoneTables(zoneId),
    enabled: !!zoneId,
  })
}

export function useAllTables() {
  return useQuery({
    queryKey: tableKeys.list(),
    queryFn: () => zoneApi.getAllTables(),
  })
}

export function useUnassignedTables() {
  return useQuery({
    queryKey: tableKeys.list(true),
    queryFn: () => zoneApi.getUnassignedTables(),
  })
}

export function useCreateZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateZoneRequest) => zoneApi.createZone(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.lists() }),
  })
}

export function useUpdateZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZoneRequest }) =>
      zoneApi.updateZone(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.lists() }),
  })
}

export function useDeleteZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => zoneApi.deleteZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.lists() }),
  })
}

export function useAssignTableToZone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tableId, zoneId }: { tableId: string; zoneId: string | null }) =>
      zoneApi.assignTableToZone(tableId, zoneId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all })
      qc.invalidateQueries({ queryKey: tableKeys.all })
    },
  })
}

export function useUpdateTableStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      zoneApi.updateTableStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all })
      qc.invalidateQueries({ queryKey: tableKeys.all })
    },
  })
}

export function useUpdateTablePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, posX, posY }: { id: string; posX: number; posY: number }) =>
      zoneApi.updateTablePosition(id, posX, posY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all })
    },
  })
}
