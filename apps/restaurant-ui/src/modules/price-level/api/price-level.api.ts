import { apiClient } from '@/lib/axios-client'
import type {
  PriceLevel,
  PricingGridRow,
  CreatePriceLevelRequest,
  UpdatePriceLevelRequest,
  SaveBulkPricingRequest,
  PriceLevelListParams,
  PaginatedResponse,
} from '../types/price-level.types'

const BASE_URL = '/price-levels'

export async function getPriceLevels(
  params: PriceLevelListParams = {},
): Promise<PaginatedResponse<PriceLevel>> {
  const { data } = await apiClient.get<PaginatedResponse<PriceLevel>>(BASE_URL, { params })
  return data
}

export async function getAllActivePriceLevels(): Promise<PriceLevel[]> {
  const { data } = await apiClient.get<PriceLevel[]>(`${BASE_URL}/active`)
  return data
}

export async function getPriceLevel(id: string): Promise<PriceLevel> {
  const { data } = await apiClient.get<PriceLevel>(`${BASE_URL}/${id}`)
  return data
}

export async function createPriceLevel(
  payload: CreatePriceLevelRequest,
): Promise<PriceLevel> {
  const { data } = await apiClient.post<PriceLevel>(BASE_URL, payload)
  return data
}

export async function updatePriceLevel(
  id: string,
  payload: UpdatePriceLevelRequest,
): Promise<PriceLevel> {
  const { data } = await apiClient.patch<PriceLevel>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function deletePriceLevel(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

export async function restorePriceLevel(id: string): Promise<PriceLevel> {
  const { data } = await apiClient.post<PriceLevel>(`${BASE_URL}/${id}/restore`)
  return data
}

export async function activatePriceLevel(id: string): Promise<PriceLevel> {
  const { data } = await apiClient.patch<PriceLevel>(`${BASE_URL}/${id}/activate`)
  return data
}

export async function deactivatePriceLevel(id: string): Promise<PriceLevel> {
  const { data } = await apiClient.patch<PriceLevel>(`${BASE_URL}/${id}/deactivate`)
  return data
}

export async function setDefaultPriceLevel(id: string): Promise<PriceLevel> {
  const { data } = await apiClient.patch<PriceLevel>(`${BASE_URL}/${id}/set-default`)
  return data
}

export async function getPricingGrid(
  priceLevelId: string,
): Promise<PricingGridRow[]> {
  const { data } = await apiClient.get<PricingGridRow[]>(
    `${BASE_URL}/${priceLevelId}/pricing-grid`,
  )
  return data
}

export async function saveBulkPricing(
  priceLevelId: string,
  payload: SaveBulkPricingRequest,
): Promise<void> {
  await apiClient.post(`${BASE_URL}/${priceLevelId}/pricing-grid`, payload)
}

export async function getEffectivePrice(
  priceLevelId: string,
  itemId: string,
): Promise<{ effectivePrice: number }> {
  const { data } = await apiClient.get<{ effectivePrice: number }>(
    `${BASE_URL}/${priceLevelId}/items/${itemId}/effective-price`,
  )
  return data
}
