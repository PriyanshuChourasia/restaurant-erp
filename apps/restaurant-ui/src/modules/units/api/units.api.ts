import { apiClient } from '@/lib/axios-client'
import type { Unit, ConversionResult } from '../types/units.types'

export async function getUnits(includeInactive = false): Promise<Unit[]> {
  const { data } = await apiClient.get('/units', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
  })
  return data
}

export async function convertUnits(
  quantity: number,
  from: string,
  to: string,
  itemId?: string,
): Promise<ConversionResult> {
  const { data } = await apiClient.get('/units/convert', {
    params: { quantity, from, to, itemId },
  })
  return data
}

// ── Multi-unit formatting API ─────────────────────────────────

export interface FormatQuantityResponse {
  quantity: number
  unit: string
  formatted: string
  compact: string
  numeric: { value: number; unit: string }
}

export interface FormatQuantityBatchResponse {
  items: Array<{ quantity: number; unit: string; formatted: string }>
}

/**
 * Format a single quantity via the backend.
 * GET /units/format?quantity=3400&unit=gram
 */
export async function formatQuantityApi(
  quantity: number,
  unit: string,
  variant?: 'full' | 'compact' | 'numeric',
): Promise<FormatQuantityResponse> {
  const params: Record<string, string | number> = { quantity, unit }
  if (variant) params.variant = variant
  const { data } = await apiClient.get<FormatQuantityResponse>('/units/format', { params })
  return data
}

/**
 * Format multiple quantities in batch via the backend.
 * POST /units/format-batch
 */
export async function formatQuantityBatchApi(
  items: Array<{ quantity: number; unit: string }>,
  variant?: 'full' | 'compact',
): Promise<FormatQuantityBatchResponse> {
  const { data } = await apiClient.post<FormatQuantityBatchResponse>('/units/format-batch', { items, variant })
  return data
}
