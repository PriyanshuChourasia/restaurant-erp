import { apiClient } from '@/lib/axios-client'
import type { DashboardSummary } from '../types/dashboard.types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get('/dashboard/summary')
  return data
}
