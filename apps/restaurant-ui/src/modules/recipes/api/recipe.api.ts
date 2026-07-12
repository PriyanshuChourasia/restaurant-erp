import { apiClient } from '@/lib/axios-client'
import type {
  Recipe,
  RecipeCostResult,
  CreateRecipeRequest,
  ProductionEntry,
  CreateProductionEntryRequest,
} from '../types/recipe.types'

const BASE_URL = '/recipes'

export async function getRecipe(itemId: string): Promise<Recipe> {
  const { data } = await apiClient.get<Recipe>(`${BASE_URL}/${itemId}`)
  return data
}

export async function upsertRecipe(payload: CreateRecipeRequest): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>(BASE_URL, payload)
  return data
}

export async function deleteRecipe(itemId: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${itemId}`)
}

export async function getRecipeCost(itemId: string): Promise<RecipeCostResult> {
  const { data } = await apiClient.get<RecipeCostResult>(`${BASE_URL}/${itemId}/cost`)
  return data
}

export async function persistRecipeCost(itemId: string): Promise<{ itemId: string; costPrice: number }> {
  const { data } = await apiClient.post<{ itemId: string; costPrice: number }>(
    `${BASE_URL}/${itemId}/recalculate-cost`,
  )
  return data
}

export async function createProductionEntry(
  payload: CreateProductionEntryRequest,
): Promise<ProductionEntry> {
  const { data } = await apiClient.post<ProductionEntry>(`${BASE_URL}/production`, payload)
  return data
}
