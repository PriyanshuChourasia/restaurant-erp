import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRecipe,
  upsertRecipe,
  deleteRecipe,
  getRecipeCost,
  persistRecipeCost,
  createProductionEntry,
} from '../api/recipe.api'
import type { CreateRecipeRequest, CreateProductionEntryRequest } from '../types/recipe.types'

export const recipeKeys = {
  all: ['recipes'] as const,
  detail: (itemId: string) => [...recipeKeys.all, 'detail', itemId] as const,
  cost: (itemId: string) => [...recipeKeys.all, 'cost', itemId] as const,
}

export function useRecipe(itemId: string) {
  return useQuery({
    queryKey: recipeKeys.detail(itemId),
    queryFn: () => getRecipe(itemId),
    enabled: !!itemId,
  })
}

export function useRecipeCost(itemId: string) {
  return useQuery({
    queryKey: recipeKeys.cost(itemId),
    queryFn: () => getRecipeCost(itemId),
    enabled: !!itemId,
  })
}

export function useUpsertRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecipeRequest) => upsertRecipe(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.outputItemId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.cost(variables.outputItemId) })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => deleteRecipe(itemId),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(itemId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.cost(itemId) })
    },
  })
}

export function usePersistRecipeCost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => persistRecipeCost(itemId),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.cost(itemId) })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useCreateProductionEntry() {
  return useMutation({
    mutationFn: (payload: CreateProductionEntryRequest) => createProductionEntry(payload),
  })
}
