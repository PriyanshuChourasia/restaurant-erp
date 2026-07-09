import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  restoreStaff,
} from '../api/staff.api'

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...staffKeys.lists(), params] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
}

export function useStaff(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => getStaff(params),
  })
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => getStaffMember(id),
    enabled: !!id,
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateStaff>[1] }) =>
      updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

export function useRestoreStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}
