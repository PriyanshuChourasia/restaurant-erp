import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../api/dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getDashboardSummary,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  })
}
