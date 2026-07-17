import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDevUsers,
  getDevUser,
  createDevUser,
  updateDevUser,
  deleteDevUser,
  restoreDevUser,
} from '../api/user.api'
import type { DevUpdateUserPayload } from '../types/user.types'

export const devUserKeys = {
  all: ['dev-users'] as const,
  lists: () => [...devUserKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...devUserKeys.lists(), params] as const,
  details: () => [...devUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...devUserKeys.details(), id] as const,
}

export function useDevUsers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: devUserKeys.list(params),
    queryFn: () => getDevUsers(params),
  })
}

export function useDevUser(id: string) {
  return useQuery({
    queryKey: devUserKeys.detail(id),
    queryFn: () => getDevUser(id),
    enabled: !!id,
  })
}

export function useCreateDevUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDevUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devUserKeys.lists() })
    },
  })
}

export function useUpdateDevUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DevUpdateUserPayload }) =>
      updateDevUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devUserKeys.all })
    },
  })
}

export function useDeleteDevUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDevUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devUserKeys.lists() })
    },
  })
}

export function useRestoreDevUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreDevUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devUserKeys.lists() })
    },
  })
}
