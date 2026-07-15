import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios-client'

export function useGenericReport(endpoint: string, fromDate?: string, toDate?: string) {
  const params: Record<string, string> = {}
  if (fromDate) params.fromDate = fromDate
  if (toDate) params.toDate = toDate

  return useQuery({
    queryKey: ['generic-report', endpoint, fromDate, toDate],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(endpoint, { params })
        return data
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return null
        }
        throw err
      }
    },
    retry: false,
  })
}
