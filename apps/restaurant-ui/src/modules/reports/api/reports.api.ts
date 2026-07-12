import { apiClient } from '@/lib/axios-client'
import type {
  DailySalesSummary,
  SalesReport,
  SalesByPaymentMethod,
  SalesByCategory,
  PopularItemsReport,
  GstReport,
  StockStatusReport,
  LowStockReport,
  BalanceSheetReport,
  ProfitLossReport,
  HourlyDistributionReport,
  VegNonVegReport,
} from '../types/report.types'

const BASE = '/reports'

export async function getDailySalesSummary(date?: string): Promise<DailySalesSummary> {
  const params = date ? { date } : {}
  const { data } = await apiClient.get(`${BASE}/sales/daily`, { params })
  return data
}

export async function getSalesReport(fromDate?: string, toDate?: string): Promise<SalesReport> {
  const { data } = await apiClient.get(`${BASE}/sales/summary`, { params: { fromDate, toDate } })
  return data
}

export async function getSalesByPaymentMethod(fromDate?: string, toDate?: string): Promise<SalesByPaymentMethod> {
  const { data } = await apiClient.get(`${BASE}/sales/by-payment-method`, { params: { fromDate, toDate } })
  return data
}

export async function getSalesByCategory(fromDate?: string, toDate?: string): Promise<SalesByCategory> {
  const { data } = await apiClient.get(`${BASE}/sales/by-category`, { params: { fromDate, toDate } })
  return data
}

export async function getPopularItems(fromDate?: string, toDate?: string, limit?: number): Promise<PopularItemsReport> {
  const { data } = await apiClient.get(`${BASE}/sales/popular-items`, { params: { fromDate, toDate, limit } })
  return data
}

export async function getGstReport(fromDate?: string, toDate?: string): Promise<GstReport> {
  const { data } = await apiClient.get(`${BASE}/sales/gst`, { params: { fromDate, toDate } })
  return data
}

export async function getHourlyDistribution(fromDate?: string, toDate?: string): Promise<HourlyDistributionReport> {
  const { data } = await apiClient.get(`${BASE}/sales/hourly-distribution`, { params: { fromDate, toDate } })
  return data
}

export async function getVegNonVegSplit(fromDate?: string, toDate?: string): Promise<VegNonVegReport> {
  const { data } = await apiClient.get(`${BASE}/sales/veg-nonveg`, { params: { fromDate, toDate } })
  return data
}

export async function getStockStatus(): Promise<StockStatusReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/stock-status`)
  return data
}

export async function getLowStockAlerts(): Promise<LowStockReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/low-stock`)
  return data
}

export async function getBalanceSheet(): Promise<BalanceSheetReport> {
  const { data } = await apiClient.get(`${BASE}/finance/balance-sheet`)
  return data
}

export async function getProfitLoss(fromDate?: string, toDate?: string): Promise<ProfitLossReport> {
  const { data } = await apiClient.get(`${BASE}/finance/profit-loss`, { params: { fromDate, toDate } })
  return data
}
