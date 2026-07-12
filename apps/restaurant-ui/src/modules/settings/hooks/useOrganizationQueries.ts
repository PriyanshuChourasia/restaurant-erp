import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as orgApi from '../api/organization.api'
import type { UpdateOrganizationRequest } from '../types/organization.types'

export const orgKeys = {
  all: ['organization'] as const,
}

export function useOrganization() {
  return useQuery({
    queryKey: orgKeys.all,
    queryFn: () => orgApi.getOrganization(),
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateOrganizationRequest) => orgApi.updateOrganization(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all })
    },
  })
}
