import { useQuery } from '@tanstack/react-query'
import * as reportsApi from '../api/reports.api'

export const reportKeys = {
  all: ['reports'] as const,
  sales: () => [...reportKeys.all, 'sales'] as const,
  dailySummary: (date?: string) => [...reportKeys.sales(), 'daily', date] as const,
  summary: (from: string, to: string) => [...reportKeys.sales(), 'summary', from, to] as const,
  byPaymentMethod: (from: string, to: string) => [...reportKeys.sales(), 'payment-method', from, to] as const,
  byCategory: (from: string, to: string) => [...reportKeys.sales(), 'category', from, to] as const,
  popularItems: (from: string, to: string, limit?: number) => [...reportKeys.sales(), 'popular-items', from, to, limit] as const,
  gst: (from: string, to: string) => [...reportKeys.sales(), 'gst', from, to] as const,
  hourly: (from: string, to: string) => [...reportKeys.sales(), 'hourly', from, to] as const,
  vegNonVeg: (from: string, to: string) => [...reportKeys.sales(), 'veg-nonveg', from, to] as const,
  inventory: () => [...reportKeys.all, 'inventory'] as const,
  stockStatus: () => [...reportKeys.inventory(), 'stock-status'] as const,
  lowStock: () => [...reportKeys.inventory(), 'low-stock'] as const,
  finance: () => [...reportKeys.all, 'finance'] as const,
  balanceSheet: () => [...reportKeys.finance(), 'balance-sheet'] as const,
  profitLoss: (from: string, to: string) => [...reportKeys.finance(), 'profit-loss', from, to] as const,
}

export function useDailySalesSummary(date?: string) {
  return useQuery({
    queryKey: reportKeys.dailySummary(date),
    queryFn: () => reportsApi.getDailySalesSummary(date),
  })
}

export function useSalesReport(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.summary(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getSalesReport(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useSalesByPaymentMethod(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.byPaymentMethod(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getSalesByPaymentMethod(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useSalesByCategory(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.byCategory(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getSalesByCategory(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePopularItems(fromDate?: string, toDate?: string, limit?: number) {
  return useQuery({
    queryKey: reportKeys.popularItems(fromDate || '', toDate || '', limit),
    queryFn: () => reportsApi.getPopularItems(fromDate, toDate, limit),
    enabled: !!fromDate && !!toDate,
  })
}

export function useGstReport(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.gst(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getGstReport(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useHourlyDistribution(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.hourly(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getHourlyDistribution(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useVegNonVegSplit(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.vegNonVeg(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getVegNonVegSplit(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useStockStatus() {
  return useQuery({
    queryKey: reportKeys.stockStatus(),
    queryFn: () => reportsApi.getStockStatus(),
  })
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: reportKeys.lowStock(),
    queryFn: () => reportsApi.getLowStockAlerts(),
  })
}

export function useBalanceSheet() {
  return useQuery({
    queryKey: reportKeys.balanceSheet(),
    queryFn: () => reportsApi.getBalanceSheet(),
  })
}

export function useProfitLoss(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.profitLoss(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getProfitLoss(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}
