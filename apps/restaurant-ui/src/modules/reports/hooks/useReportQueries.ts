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

  // Sales Trends
  trends: (from: string, to: string, groupBy: string) => [...reportKeys.sales(), 'trends', from, to, groupBy] as const,
  discountAnalysis: (from: string, to: string) => [...reportKeys.sales(), 'discount', from, to] as const,
  invoiceDrillDown: (id: string) => [...reportKeys.sales(), 'invoice', id] as const,
  cancelled: (from: string, to: string) => [...reportKeys.sales(), 'cancelled', from, to] as const,
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

export function useSalesTrends(fromDate?: string, toDate?: string, groupBy?: string) {
  return useQuery({
    queryKey: reportKeys.trends(fromDate || '', toDate || '', groupBy || 'week'),
    queryFn: () => reportsApi.getSalesTrends(fromDate, toDate, groupBy),
    enabled: !!fromDate && !!toDate,
  })
}

export function useDiscountAnalysis(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.discountAnalysis(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getDiscountAnalysis(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useInvoiceDrillDown(id: string) {
  return useQuery({
    queryKey: reportKeys.invoiceDrillDown(id),
    queryFn: () => reportsApi.getInvoiceDrillDown(id),
    enabled: !!id,
  })
}

export function useCancelledTransactions(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: reportKeys.cancelled(fromDate || '', toDate || ''),
    queryFn: () => reportsApi.getCancelledTransactions(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useGstReturn(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['reports', 'finance', 'gst-return', fromDate, toDate],
    queryFn: () => reportsApi.getGstReturn(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useTaxSummary(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['reports', 'finance', 'tax-summary', fromDate, toDate],
    queryFn: () => reportsApi.getTaxSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export function useStockMovements(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'movements', fromDate, toDate],
    queryFn: () => reportsApi.getStockMovements(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useStockValuation() {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'valuation'],
    queryFn: () => reportsApi.getStockValuation(),
  })
}

export function useWastageReport(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'wastage', fromDate, toDate],
    queryFn: () => reportsApi.getWastageReport(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useConsumptionAnalysis(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'consumption', fromDate, toDate],
    queryFn: () => reportsApi.getConsumptionAnalysis(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useProductionReport(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'production', fromDate, toDate],
    queryFn: () => reportsApi.getProductionReport(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useRecipeCosts() {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'recipe-costs'],
    queryFn: () => reportsApi.getRecipeCosts(),
  })
}

export function useStockReconciliation() {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'reconciliation'],
    queryFn: () => reportsApi.getStockReconciliation(),
  })
}

export function usePurchaseTimeline(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.inventory(), 'purchase-timeline', fromDate, toDate],
    queryFn: () => reportsApi.getPurchaseTimeline(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Finance ──────────────────────────────────────────────────────────────────

export function useCashFlow(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.finance(), 'cash-flow', fromDate, toDate],
    queryFn: () => reportsApi.getCashFlow(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useExpenses(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.finance(), 'expenses', fromDate, toDate],
    queryFn: () => reportsApi.getExpenses(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useRevenueVsExpense(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.finance(), 'revenue-vs-expense', fromDate, toDate],
    queryFn: () => reportsApi.getRevenueVsExpense(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useLedgerStatement(accountId?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.finance(), 'ledger', accountId, fromDate, toDate],
    queryFn: () => reportsApi.getLedgerStatement(accountId, fromDate, toDate),
  })
}

// ── Kitchen ──────────────────────────────────────────────────────────────────

export function useKitchenQueueStatus() {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'queue-status'],
    queryFn: () => reportsApi.getKitchenQueueStatus(),
  })
}

export function useKitchenPerformance(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'performance', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenPerformance(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useKitchenStationLoad(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'station-load', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenStationLoad(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useKitchenItemFrequency(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'item-frequency', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenItemFrequency(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useKitchenCancellation(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'cancellation', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenCancellation(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useKitchenThroughput(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'throughput', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenThroughput(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useKitchenDietaryMix(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'kitchen', 'dietary-mix', fromDate, toDate],
    queryFn: () => reportsApi.getKitchenDietaryMix(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Customer ─────────────────────────────────────────────────────────────────

export function useCustomerDirectory() {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'directory'],
    queryFn: () => reportsApi.getCustomerDirectory(),
  })
}

export function useCustomerRevenue(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'revenue', fromDate, toDate],
    queryFn: () => reportsApi.getCustomerRevenue(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useCustomerLoyalty() {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'loyalty'],
    queryFn: () => reportsApi.getCustomerLoyalty(),
  })
}

export function useCustomerNewVsReturning(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'new-vs-returning', fromDate, toDate],
    queryFn: () => reportsApi.getCustomerNewVsReturning(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useCustomerTypeAnalysis() {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'type-analysis'],
    queryFn: () => reportsApi.getCustomerTypeAnalysis(),
  })
}

export function useCustomerLifetimeValue() {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'lifetime-value'],
    queryFn: () => reportsApi.getCustomerLifetimeValue(),
  })
}

export function useCustomerPreferences() {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'preferences'],
    queryFn: () => reportsApi.getCustomerPreferences(),
  })
}

export function useWalkinVsRegistered(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'customer', 'walkin-vs-registered', fromDate, toDate],
    queryFn: () => reportsApi.getWalkinVsRegistered(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Reservation ──────────────────────────────────────────────────────────────

export function useReservationOverview(date?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'overview', date],
    queryFn: () => reportsApi.getReservationOverview(date),
  })
}

export function useTableUtilization(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'table-utilization', fromDate, toDate],
    queryFn: () => reportsApi.getTableUtilization(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useReservationSource(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'source', fromDate, toDate],
    queryFn: () => reportsApi.getReservationSource(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useReservationNoShow(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'no-show', fromDate, toDate],
    queryFn: () => reportsApi.getReservationNoShow(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useReservationPeakHours(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'peak-hours', fromDate, toDate],
    queryFn: () => reportsApi.getReservationPeakHours(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useReservationZonePerformance(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'reservation', 'zone-performance', fromDate, toDate],
    queryFn: () => reportsApi.getReservationZonePerformance(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Procurement ──────────────────────────────────────────────────────────────

export function usePOSummary(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'po-summary', fromDate, toDate],
    queryFn: () => reportsApi.getPOSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useSupplierPerformance(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'supplier-performance', fromDate, toDate],
    queryFn: () => reportsApi.getSupplierPerformance(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePurchaseByItem(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'purchase-by-item', fromDate, toDate],
    queryFn: () => reportsApi.getPurchaseByItem(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePriceComparison(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'price-comparison', fromDate, toDate],
    queryFn: () => reportsApi.getPriceComparison(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePurchaseToPay(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'purchase-to-pay', fromDate, toDate],
    queryFn: () => reportsApi.getPurchaseToPay(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useReorderReport() {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'reorder'],
    queryFn: () => reportsApi.getReorderReport(),
  })
}

export function useProcurementMonthlyTrend(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'procurement', 'monthly-trend', fromDate, toDate],
    queryFn: () => reportsApi.getProcurementMonthlyTrend(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Operations ───────────────────────────────────────────────────────────────

export function useDailyOpsSummary(date?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'daily-summary', date],
    queryFn: () => reportsApi.getDailyOpsSummary(date),
  })
}

export function useStaffActivity(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'staff-activity', fromDate, toDate],
    queryFn: () => reportsApi.getStaffActivity(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useHourlyOperations(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'hourly', fromDate, toDate],
    queryFn: () => reportsApi.getHourlyOperations(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useWeeklyReview(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'weekly-review', fromDate, toDate],
    queryFn: () => reportsApi.getWeeklyReview(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePeakStaffing(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'peak-staffing', fromDate, toDate],
    queryFn: () => reportsApi.getPeakStaffing(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function usePaymentCollection(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'payment-collection', fromDate, toDate],
    queryFn: () => reportsApi.getPaymentCollection(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useCancellationSummary(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'cancellation-summary', fromDate, toDate],
    queryFn: () => reportsApi.getCancellationSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useEodReconciliation(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'operations', 'eod-reconciliation', fromDate, toDate],
    queryFn: () => reportsApi.getEodReconciliation(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

// ── Executive ────────────────────────────────────────────────────────────────

export function useKpiDashboard() {
  return useQuery({
    queryKey: [...reportKeys.all, 'executive', 'kpi-dashboard'],
    queryFn: () => reportsApi.getKpiDashboard(),
  })
}

export function useExecutiveProfitability(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'executive', 'profitability', fromDate, toDate],
    queryFn: () => reportsApi.getExecutiveProfitability(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useHealthScorecard() {
  return useQuery({
    queryKey: [...reportKeys.all, 'executive', 'health-scorecard'],
    queryFn: () => reportsApi.getHealthScorecard(),
  })
}

export function useTrendForecast() {
  return useQuery({
    queryKey: [...reportKeys.all, 'executive', 'trend-forecast'],
    queryFn: () => reportsApi.getTrendForecast(),
  })
}

export function useExecutiveComparative(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: [...reportKeys.all, 'executive', 'comparative', fromDate, toDate],
    queryFn: () => reportsApi.getExecutiveComparative(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}
