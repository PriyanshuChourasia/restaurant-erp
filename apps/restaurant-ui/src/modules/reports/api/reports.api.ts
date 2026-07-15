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
  SalesTrendsReport,
  DiscountAnalysisReport,
  InvoiceDrillDownReport,
  CancelledTransactionsReport,
  GstReturnReport,
  TaxSummaryReport,
  StockMovementReport,
  StockValuationReport,
  WastageReport,
  ConsumptionReport,
  ProductionReport,
  RecipeCostsReport,
  ReconciliationReport,
  PurchaseTimelineReport,
  CashFlowReport,
  ExpenseReport,
  RevenueVsExpenseReport,
  LedgerStatementReport,
  QueueStatusReport,
  KitchenPerformanceReport,
  StationLoadReport,
  ItemFrequencyReport,
  KOTCancellationReport,
  ThroughputReport,
  DietaryMixReport,
  CustomerDirectoryReport,
  CustomerRevenueReport,
  LoyaltyReport,
  NewVsReturningReport,
  TypeAnalysisReport,
  LifetimeValueReport,
  PreferencesReport,
  WalkinVsRegisteredReport,
  ReservationOverviewReport,
  TableUtilizationReport,
  ReservationSourceReport,
  NoShowReport,
  PeakHoursReport,
  ZonePerformanceReport,
  POSummaryReport,
  SupplierPerformanceReport,
  PurchaseByItemReport,
  PriceComparisonReport,
  PurchaseToPayReport,
  ReorderReport,
  MonthlyTrendReport,
  DailyOpsSummaryReport,
  StaffActivityReport,
  HourlyOpsReport,
  WeeklyReviewReport,
  PeakStaffingReport,
  PaymentCollectionReport,
  CancellationSummaryReport,
  EodReconciliationReport,
  KpiDashboardReport,
  ProfitabilityReport,
  HealthScorecardReport,
  TrendForecastReport,
  ComparativeReport,
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

export async function getSalesTrends(fromDate?: string, toDate?: string, groupBy?: string): Promise<SalesTrendsReport> {
  const { data } = await apiClient.get(`${BASE}/sales/trends`, { params: { fromDate, toDate, groupBy } })
  return data
}

export async function getDiscountAnalysis(fromDate?: string, toDate?: string): Promise<DiscountAnalysisReport> {
  const { data } = await apiClient.get(`${BASE}/sales/discount-analysis`, { params: { fromDate, toDate } })
  return data
}

export async function getInvoiceDrillDown(id: string): Promise<InvoiceDrillDownReport> {
  const { data } = await apiClient.get(`${BASE}/sales/invoice/${id}`)
  return data
}

export async function getCancelledTransactions(fromDate?: string, toDate?: string): Promise<CancelledTransactionsReport> {
  const { data } = await apiClient.get(`${BASE}/sales/cancelled`, { params: { fromDate, toDate } })
  return data
}

export async function getGstReturn(fromDate?: string, toDate?: string): Promise<GstReturnReport> {
  const { data } = await apiClient.get(`${BASE}/finance/gst-return`, { params: { fromDate, toDate } })
  return data
}

export async function getTaxSummary(fromDate?: string, toDate?: string): Promise<TaxSummaryReport> {
  const { data } = await apiClient.get(`${BASE}/finance/tax-summary`, { params: { fromDate, toDate } })
  return data
}

// ── Inventory: Movements ─────────────────────────────────────────────────────
export async function getStockMovements(fromDate?: string, toDate?: string): Promise<StockMovementReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/movements`, { params: { fromDate, toDate } })
  return data
}

// ── Inventory: Valuation ─────────────────────────────────────────────────────
export async function getStockValuation(): Promise<StockValuationReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/valuation`)
  return data
}

// ── Inventory: Wastage ───────────────────────────────────────────────────────
export async function getWastageReport(fromDate?: string, toDate?: string): Promise<WastageReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/wastage`, { params: { fromDate, toDate } })
  return data
}

// ── Inventory: Consumption ───────────────────────────────────────────────────
export async function getConsumptionAnalysis(fromDate?: string, toDate?: string): Promise<ConsumptionReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/consumption`, { params: { fromDate, toDate } })
  return data
}

// ── Inventory: Production ────────────────────────────────────────────────────
export async function getProductionReport(fromDate?: string, toDate?: string): Promise<ProductionReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/production`, { params: { fromDate, toDate } })
  return data
}

// ── Inventory: Recipe Costs ──────────────────────────────────────────────────
export async function getRecipeCosts(): Promise<RecipeCostsReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/recipe-costs`)
  return data
}

// ── Inventory: Reconciliation ────────────────────────────────────────────────
export async function getStockReconciliation(): Promise<ReconciliationReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/reconciliation`)
  return data
}

// ── Inventory: Purchase Timeline ─────────────────────────────────────────────
export async function getPurchaseTimeline(fromDate?: string, toDate?: string): Promise<PurchaseTimelineReport> {
  const { data } = await apiClient.get(`${BASE}/inventory/purchase-timeline`, { params: { fromDate, toDate } })
  return data
}

// ── Finance: Cash Flow ───────────────────────────────────────────────────────
export async function getCashFlow(fromDate?: string, toDate?: string): Promise<CashFlowReport> {
  const { data } = await apiClient.get(`${BASE}/finance/cash-flow`, { params: { fromDate, toDate } })
  return data
}

// ── Finance: Expenses ────────────────────────────────────────────────────────
export async function getExpenses(fromDate?: string, toDate?: string): Promise<ExpenseReport> {
  const { data } = await apiClient.get(`${BASE}/finance/expenses`, { params: { fromDate, toDate } })
  return data
}

// ── Finance: Revenue vs Expense ──────────────────────────────────────────────
export async function getRevenueVsExpense(fromDate?: string, toDate?: string): Promise<RevenueVsExpenseReport> {
  const { data } = await apiClient.get(`${BASE}/finance/revenue-vs-expense`, { params: { fromDate, toDate } })
  return data
}

// ── Finance: Ledger Statement ────────────────────────────────────────────────
export async function getLedgerStatement(accountId?: string, fromDate?: string, toDate?: string): Promise<LedgerStatementReport> {
  const { data } = await apiClient.get(`${BASE}/finance/ledger-statement`, { params: { accountId, fromDate, toDate } })
  return data
}

// ── Kitchen: Queue Status ────────────────────────────────────────────────────
export async function getKitchenQueueStatus(): Promise<QueueStatusReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/queue-status`)
  return data
}

// ── Kitchen: Performance ─────────────────────────────────────────────────────
export async function getKitchenPerformance(fromDate?: string, toDate?: string): Promise<KitchenPerformanceReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/performance`, { params: { fromDate, toDate } })
  return data
}

// ── Kitchen: Station Load ────────────────────────────────────────────────────
export async function getKitchenStationLoad(fromDate?: string, toDate?: string): Promise<StationLoadReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/station-load`, { params: { fromDate, toDate } })
  return data
}

// ── Kitchen: Item Frequency ──────────────────────────────────────────────────
export async function getKitchenItemFrequency(fromDate?: string, toDate?: string): Promise<ItemFrequencyReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/item-frequency`, { params: { fromDate, toDate } })
  return data
}

// ── Kitchen: KOT Cancellation ────────────────────────────────────────────────
export async function getKitchenCancellation(fromDate?: string, toDate?: string): Promise<KOTCancellationReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/cancellation`, { params: { fromDate, toDate } })
  return data
}

// ── Kitchen: Throughput ──────────────────────────────────────────────────────
export async function getKitchenThroughput(fromDate?: string, toDate?: string): Promise<ThroughputReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/throughput`, { params: { fromDate, toDate } })
  return data
}

// ── Kitchen: Dietary Mix ─────────────────────────────────────────────────────
export async function getKitchenDietaryMix(fromDate?: string, toDate?: string): Promise<DietaryMixReport> {
  const { data } = await apiClient.get(`${BASE}/kitchen/dietary-mix`, { params: { fromDate, toDate } })
  return data
}

// ── Customer: Directory ──────────────────────────────────────────────────────
export async function getCustomerDirectory(): Promise<CustomerDirectoryReport> {
  const { data } = await apiClient.get(`${BASE}/customer/directory`)
  return data
}

// ── Customer: Revenue ────────────────────────────────────────────────────────
export async function getCustomerRevenue(fromDate?: string, toDate?: string): Promise<CustomerRevenueReport> {
  const { data } = await apiClient.get(`${BASE}/customer/revenue`, { params: { fromDate, toDate } })
  return data
}

// ── Customer: Loyalty ────────────────────────────────────────────────────────
export async function getCustomerLoyalty(): Promise<LoyaltyReport> {
  const { data } = await apiClient.get(`${BASE}/customer/loyalty`)
  return data
}

// ── Customer: New vs Returning ───────────────────────────────────────────────
export async function getCustomerNewVsReturning(fromDate?: string, toDate?: string): Promise<NewVsReturningReport> {
  const { data } = await apiClient.get(`${BASE}/customer/new-vs-returning`, { params: { fromDate, toDate } })
  return data
}

// ── Customer: Type Analysis ──────────────────────────────────────────────────
export async function getCustomerTypeAnalysis(): Promise<TypeAnalysisReport> {
  const { data } = await apiClient.get(`${BASE}/customer/type-analysis`)
  return data
}

// ── Customer: Lifetime Value ─────────────────────────────────────────────────
export async function getCustomerLifetimeValue(): Promise<LifetimeValueReport> {
  const { data } = await apiClient.get(`${BASE}/customer/lifetime-value`)
  return data
}

// ── Customer: Preferences ────────────────────────────────────────────────────
export async function getCustomerPreferences(): Promise<PreferencesReport> {
  const { data } = await apiClient.get(`${BASE}/customer/preferences`)
  return data
}

// ── Customer: Walkin vs Registered ───────────────────────────────────────────
export async function getWalkinVsRegistered(fromDate?: string, toDate?: string): Promise<WalkinVsRegisteredReport> {
  const { data } = await apiClient.get(`${BASE}/customer/walkin-vs-registered`, { params: { fromDate, toDate } })
  return data
}

// ── Reservation: Overview ────────────────────────────────────────────────────
export async function getReservationOverview(date?: string): Promise<ReservationOverviewReport> {
  const params = date ? { date } : {}
  const { data } = await apiClient.get(`${BASE}/reservation/overview`, { params })
  return data
}

// ── Reservation: Table Utilization ───────────────────────────────────────────
export async function getTableUtilization(fromDate?: string, toDate?: string): Promise<TableUtilizationReport> {
  const { data } = await apiClient.get(`${BASE}/reservation/table-utilization`, { params: { fromDate, toDate } })
  return data
}

// ── Reservation: Source Analysis ─────────────────────────────────────────────
export async function getReservationSource(fromDate?: string, toDate?: string): Promise<ReservationSourceReport> {
  const { data } = await apiClient.get(`${BASE}/reservation/source`, { params: { fromDate, toDate } })
  return data
}

// ── Reservation: No-Show ─────────────────────────────────────────────────────
export async function getReservationNoShow(fromDate?: string, toDate?: string): Promise<NoShowReport> {
  const { data } = await apiClient.get(`${BASE}/reservation/no-show`, { params: { fromDate, toDate } })
  return data
}

// ── Reservation: Peak Hours ──────────────────────────────────────────────────
export async function getReservationPeakHours(fromDate?: string, toDate?: string): Promise<PeakHoursReport> {
  const { data } = await apiClient.get(`${BASE}/reservation/peak-hours`, { params: { fromDate, toDate } })
  return data
}

// ── Reservation: Zone Performance ────────────────────────────────────────────
export async function getReservationZonePerformance(fromDate?: string, toDate?: string): Promise<ZonePerformanceReport> {
  const { data } = await apiClient.get(`${BASE}/reservation/zone-performance`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: PO Summary ──────────────────────────────────────────────────
export async function getPOSummary(fromDate?: string, toDate?: string): Promise<POSummaryReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/po-summary`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: Supplier Performance ────────────────────────────────────────
export async function getSupplierPerformance(fromDate?: string, toDate?: string): Promise<SupplierPerformanceReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/supplier-performance`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: Purchase by Item ────────────────────────────────────────────
export async function getPurchaseByItem(fromDate?: string, toDate?: string): Promise<PurchaseByItemReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/purchase-by-item`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: Price Comparison ────────────────────────────────────────────
export async function getPriceComparison(fromDate?: string, toDate?: string): Promise<PriceComparisonReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/price-comparison`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: Purchase-to-Pay ─────────────────────────────────────────────
export async function getPurchaseToPay(fromDate?: string, toDate?: string): Promise<PurchaseToPayReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/purchase-to-pay`, { params: { fromDate, toDate } })
  return data
}

// ── Procurement: Reorder ─────────────────────────────────────────────────────
export async function getReorderReport(): Promise<ReorderReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/reorder`)
  return data
}

// ── Procurement: Monthly Trend ───────────────────────────────────────────────
export async function getProcurementMonthlyTrend(fromDate?: string, toDate?: string): Promise<MonthlyTrendReport> {
  const { data } = await apiClient.get(`${BASE}/procurement/monthly-trend`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Daily Summary ────────────────────────────────────────────────
export async function getDailyOpsSummary(date?: string): Promise<DailyOpsSummaryReport> {
  const params = date ? { date } : {}
  const { data } = await apiClient.get(`${BASE}/operations/daily-summary`, { params })
  return data
}

// ── Operations: Staff Activity ───────────────────────────────────────────────
export async function getStaffActivity(fromDate?: string, toDate?: string): Promise<StaffActivityReport> {
  const { data } = await apiClient.get(`${BASE}/operations/staff-activity`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Hourly ───────────────────────────────────────────────────────
export async function getHourlyOperations(fromDate?: string, toDate?: string): Promise<HourlyOpsReport> {
  const { data } = await apiClient.get(`${BASE}/operations/hourly`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Weekly Review ────────────────────────────────────────────────
export async function getWeeklyReview(fromDate?: string, toDate?: string): Promise<WeeklyReviewReport> {
  const { data } = await apiClient.get(`${BASE}/operations/weekly-review`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Peak Staffing ────────────────────────────────────────────────
export async function getPeakStaffing(fromDate?: string, toDate?: string): Promise<PeakStaffingReport> {
  const { data } = await apiClient.get(`${BASE}/operations/peak-staffing`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Payment Collection ───────────────────────────────────────────
export async function getPaymentCollection(fromDate?: string, toDate?: string): Promise<PaymentCollectionReport> {
  const { data } = await apiClient.get(`${BASE}/operations/payment-collection`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: Cancellation Summary ─────────────────────────────────────────
export async function getCancellationSummary(fromDate?: string, toDate?: string): Promise<CancellationSummaryReport> {
  const { data } = await apiClient.get(`${BASE}/operations/cancellation-summary`, { params: { fromDate, toDate } })
  return data
}

// ── Operations: EoD Reconciliation ───────────────────────────────────────────
export async function getEodReconciliation(fromDate?: string, toDate?: string): Promise<EodReconciliationReport> {
  const { data } = await apiClient.get(`${BASE}/operations/eod-reconciliation`, { params: { fromDate, toDate } })
  return data
}

// ── Executive: KPI Dashboard ─────────────────────────────────────────────────
export async function getKpiDashboard(): Promise<KpiDashboardReport> {
  const { data } = await apiClient.get(`${BASE}/executive/kpi-dashboard`)
  return data
}

// ── Executive: Profitability ─────────────────────────────────────────────────
export async function getExecutiveProfitability(fromDate?: string, toDate?: string): Promise<ProfitabilityReport> {
  const { data } = await apiClient.get(`${BASE}/executive/profitability`, { params: { fromDate, toDate } })
  return data
}

// ── Executive: Health Scorecard ──────────────────────────────────────────────
export async function getHealthScorecard(): Promise<HealthScorecardReport> {
  const { data } = await apiClient.get(`${BASE}/executive/health-scorecard`)
  return data
}

// ── Executive: Trend Forecast ────────────────────────────────────────────────
export async function getTrendForecast(): Promise<TrendForecastReport> {
  const { data } = await apiClient.get(`${BASE}/executive/trend-forecast`)
  return data
}

// ── Executive: Comparative ───────────────────────────────────────────────────
export async function getExecutiveComparative(fromDate?: string, toDate?: string): Promise<ComparativeReport> {
  const { data } = await apiClient.get(`${BASE}/executive/comparative`, { params: { fromDate, toDate } })
  return data
}
