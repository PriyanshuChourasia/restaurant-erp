import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPriceLevels,
  getPriceLevel,
  getAllActivePriceLevels,
  getPricingGrid,
  createPriceLevel,
  updatePriceLevel,
  deletePriceLevel,
  restorePriceLevel,
  activatePriceLevel,
  deactivatePriceLevel,
  setDefaultPriceLevel,
  saveBulkPricing,
} from '../api/price-level.api'
import type {
  CreatePriceLevelRequest,
  UpdatePriceLevelRequest,
  PriceLevelListParams,
  SaveBulkPricingRequest,
} from '../types/price-level.types'

export const priceLevelKeys = {
  all: ['price-levels'] as const,
  lists: () => [...priceLevelKeys.all, 'list'] as const,
  list: (params: PriceLevelListParams) => [...priceLevelKeys.lists(), params] as const,
  active: () => [...priceLevelKeys.all, 'active'] as const,
  details: () => [...priceLevelKeys.all, 'detail'] as const,
  detail: (id: string) => [...priceLevelKeys.details(), id] as const,
  pricingGrid: (id: string) => [...priceLevelKeys.all, 'pricing-grid', id] as const,
}

// ---- Queries ----

export function usePriceLevels(params: PriceLevelListParams = {}) {
  return useQuery({
    queryKey: priceLevelKeys.list(params),
    queryFn: () => getPriceLevels(params),
  })
}

export function useActivePriceLevels() {
  return useQuery({
    queryKey: priceLevelKeys.active(),
    queryFn: () => getAllActivePriceLevels(),
  })
}

export function usePriceLevel(id: string) {
  return useQuery({
    queryKey: priceLevelKeys.detail(id),
    queryFn: () => getPriceLevel(id),
    enabled: !!id,
  })
}

export function usePricingGrid(priceLevelId: string) {
  return useQuery({
    queryKey: priceLevelKeys.pricingGrid(priceLevelId),
    queryFn: () => getPricingGrid(priceLevelId),
    enabled: !!priceLevelId,
  })
}

// ---- Mutations ----

export function useCreatePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePriceLevelRequest) => createPriceLevel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.active() })
    },
  })
}

export function useUpdatePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePriceLevelRequest }) =>
      updatePriceLevel(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.active() })
    },
  })
}

export function useDeletePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePriceLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.active() })
    },
  })
}

export function useRestorePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restorePriceLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.active() })
    },
  })
}

export function useActivatePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activatePriceLevel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
    },
  })
}

export function useDeactivatePriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivatePriceLevel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
    },
  })
}

export function useSetDefaultPriceLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => setDefaultPriceLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceLevelKeys.active() })
    },
  })
}

export function useSaveBulkPricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      priceLevelId,
      payload,
    }: {
      priceLevelId: string
      payload: SaveBulkPricingRequest
    }) => saveBulkPricing(priceLevelId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: priceLevelKeys.pricingGrid(variables.priceLevelId),
      })
    },
  })
}
