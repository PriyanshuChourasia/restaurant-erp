import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCostCentres,
  getCostCentre,
  createCostCentre,
  updateCostCentre,
  deleteCostCentre,
} from '../api/cost-centre.api'

export const costCentreKeys = {
  all: ['cost-centres'] as const,
  lists: () => [...costCentreKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...costCentreKeys.lists(), params] as const,
  details: () => [...costCentreKeys.all, 'detail'] as const,
  detail: (id: string) => [...costCentreKeys.details(), id] as const,
}

export function useCostCentres(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: costCentreKeys.list(params),
    queryFn: () => getCostCentres(params),
  })
}

export function useCostCentre(id: string) {
  return useQuery({
    queryKey: costCentreKeys.detail(id),
    queryFn: () => getCostCentre(id),
    enabled: !!id,
  })
}

export function useCreateCostCentre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCostCentre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCentreKeys.lists() })
    },
  })
}

export function useUpdateCostCentre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Parameters<typeof updateCostCentre>[1]> }) =>
      updateCostCentre(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCentreKeys.all })
    },
  })
}

export function useDeleteCostCentre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCostCentre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCentreKeys.lists() })
    },
  })
}
