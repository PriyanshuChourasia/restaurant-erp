import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // ── Sales Reports ────────────────────────────────────────────────────

  @Get('sales/daily')
  getDailySalesSummary(@Query('date') date?: string) {
    return this.service.getDailySalesSummary(date);
  }

  @Get('sales/summary')
  getSalesReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getSalesReport(fromDate, toDate);
  }

  @Get('sales/by-payment-method')
  getSalesByPaymentMethod(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getSalesByPaymentMethod(fromDate, toDate);
  }

  @Get('sales/by-category')
  getSalesByCategory(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getSalesByCategory(fromDate, toDate);
  }

  @Get('sales/popular-items')
  getPopularItems(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getPopularItems(fromDate, toDate, limit ? Number(limit) : 20);
  }

  @Get('sales/gst')
  getGstReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getGstReport(fromDate, toDate);
  }

  @Get('sales/hourly-distribution')
  getHourlyDistribution(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getHourlyDistribution(fromDate, toDate);
  }

  @Get('sales/veg-nonveg')
  getVegNonVegSplit(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getVegNonVegSplit(fromDate, toDate);
  }

  @Get('sales/trends')
  getSalesTrends(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.service.getSalesTrends(fromDate, toDate, (groupBy as 'week' | 'month') || 'week');
  }

  @Get('sales/discount-analysis')
  getDiscountAnalysis(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getDiscountAnalysis(fromDate, toDate);
  }

  @Get('sales/invoice/:id')
  getInvoiceDrillDown(@Param('id') id: string) {
    return this.service.getInvoiceDrillDown(id);
  }

  @Get('sales/cancelled')
  getCancelledTransactions(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getCancelledTransactions(fromDate, toDate);
  }

  // ── Inventory Reports ────────────────────────────────────────────────

  @Get('inventory/stock-status')
  getStockStatus() {
    return this.service.getStockStatus();
  }

  @Get('inventory/low-stock')
  getLowStockAlerts() {
    return this.service.getLowStockAlerts();
  }

  @Get('inventory/movements')
  getStockMovements(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getStockMovements(fromDate, toDate);
  }

  @Get('inventory/valuation')
  getStockValuation() {
    return this.service.getStockValuation();
  }

  @Get('inventory/wastage')
  getWastageReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getWastageReport(fromDate, toDate);
  }

  @Get('inventory/consumption')
  getConsumptionAnalysis(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getConsumptionAnalysis(fromDate, toDate);
  }

  @Get('inventory/production')
  getProductionReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getProductionReport(fromDate, toDate);
  }

  @Get('inventory/recipe-costs')
  getRecipeCosts() {
    return this.service.getRecipeCosts();
  }

  @Get('inventory/reconciliation')
  getStockReconciliation() {
    return this.service.getStockReconciliation();
  }

  @Get('inventory/purchase-timeline')
  getPurchaseTimeline(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPurchaseTimeline(fromDate, toDate);
  }

  // ── Financial Reports ────────────────────────────────────────────────

  @Get('finance/balance-sheet')
  getBalanceSheet() {
    return this.service.getBalanceSheet();
  }

  @Get('finance/profit-loss')
  getProfitLoss(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getProfitLoss(fromDate, toDate);
  }

  @Get('finance/cash-flow')
  getCashFlow(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getCashFlow(fromDate, toDate);
  }

  @Get('finance/gst-return')
  getGstReturn(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getGstReturn(fromDate, toDate);
  }

  @Get('finance/expenses')
  getExpenses(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getExpenses(fromDate, toDate);
  }

  @Get('finance/revenue-vs-expense')
  getRevenueVsExpense(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getRevenueVsExpense(fromDate, toDate);
  }

  @Get('finance/tax-summary')
  getTaxSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getTaxSummary(fromDate, toDate);
  }

  @Get('finance/ledger-statement')
  getLedgerStatement(
    @Query('accountId') accountId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getLedgerStatement(accountId, fromDate, toDate);
  }

  // ── Kitchen Reports ──────────────────────────────────────────────────

  @Get('kitchen/queue-status')
  getKitchenQueueStatus() {
    return this.service.getKitchenQueueStatus();
  }

  @Get('kitchen/performance')
  getKitchenPerformance(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenPerformance(fromDate, toDate);
  }

  @Get('kitchen/station-load')
  getKitchenStationLoad(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenStationLoad(fromDate, toDate);
  }

  @Get('kitchen/item-frequency')
  getKitchenItemFrequency(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenItemFrequency(fromDate, toDate);
  }

  @Get('kitchen/cancellation')
  getKitchenCancellation(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenCancellation(fromDate, toDate);
  }

  @Get('kitchen/throughput')
  getKitchenThroughput(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenThroughput(fromDate, toDate);
  }

  @Get('kitchen/dietary-mix')
  getKitchenDietaryMix(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getKitchenDietaryMix(fromDate, toDate);
  }

  // ── Customer Reports ─────────────────────────────────────────────────

  @Get('customer/directory')
  getCustomerDirectory() {
    return this.service.getCustomerDirectory();
  }

  @Get('customer/revenue')
  getCustomerRevenue(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getCustomerRevenue(fromDate, toDate);
  }

  @Get('customer/loyalty')
  getCustomerLoyalty() {
    return this.service.getCustomerLoyalty();
  }

  @Get('customer/new-vs-returning')
  getNewVsReturning(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getNewVsReturning(fromDate, toDate);
  }

  @Get('customer/type-analysis')
  getCustomerTypeAnalysis() {
    return this.service.getCustomerTypeAnalysis();
  }

  @Get('customer/lifetime-value')
  getCustomerLifetimeValue() {
    return this.service.getCustomerLifetimeValue();
  }

  @Get('customer/preferences')
  getCustomerPreferences() {
    return this.service.getCustomerPreferences();
  }

  @Get('customer/walkin-vs-registered')
  getWalkinVsRegistered(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getWalkinVsRegistered(fromDate, toDate);
  }

  // ── Reservation Reports ──────────────────────────────────────────────

  @Get('reservation/overview')
  getReservationOverview(@Query('date') date?: string) {
    return this.service.getReservationOverview(date);
  }

  @Get('reservation/table-utilization')
  getTableUtilization(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getTableUtilization(fromDate, toDate);
  }

  @Get('reservation/source')
  getReservationSource(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getReservationSource(fromDate, toDate);
  }

  @Get('reservation/no-show')
  getReservationNoShow(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getReservationNoShow(fromDate, toDate);
  }

  @Get('reservation/peak-hours')
  getReservationPeakHours(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getReservationPeakHours(fromDate, toDate);
  }

  @Get('reservation/zone-performance')
  getZonePerformance(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getZonePerformance(fromDate, toDate);
  }

  // ── Procurement Reports ──────────────────────────────────────────────

  @Get('procurement/po-summary')
  getPoSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPoSummary(fromDate, toDate);
  }

  @Get('procurement/supplier-performance')
  getSupplierPerformance(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getSupplierPerformance(fromDate, toDate);
  }

  @Get('procurement/purchase-by-item')
  getPurchaseByItem(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPurchaseByItem(fromDate, toDate);
  }

  @Get('procurement/price-comparison')
  getPriceComparison(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPriceComparison(fromDate, toDate);
  }

  @Get('procurement/purchase-to-pay')
  getPurchaseToPay(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPurchaseToPay(fromDate, toDate);
  }

  @Get('procurement/reorder')
  getReorderReport() {
    return this.service.getReorderReport();
  }

  @Get('procurement/monthly-trend')
  getMonthlyPurchaseTrend(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getMonthlyPurchaseTrend(fromDate, toDate);
  }

  // ── Operations Reports ───────────────────────────────────────────────

  @Get('operations/daily-summary')
  getDailySummary(@Query('date') date?: string) {
    return this.service.getDailySummary(date);
  }

  @Get('operations/staff-activity')
  getStaffActivity(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getStaffActivity(fromDate, toDate);
  }

  @Get('operations/hourly')
  getHourlyOperations(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getHourlyOperations(fromDate, toDate);
  }

  @Get('operations/weekly-review')
  getWeeklyReview(@Query('date') date?: string) {
    return this.service.getWeeklyReview(date);
  }

  @Get('operations/peak-staffing')
  getPeakStaffing(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPeakStaffing(fromDate, toDate);
  }

  @Get('operations/payment-collection')
  getPaymentCollection(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getPaymentCollection(fromDate, toDate);
  }

  @Get('operations/cancellation-summary')
  getCancellationSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getCancellationSummary(fromDate, toDate);
  }

  @Get('operations/eod-reconciliation')
  getEodReconciliation(@Query('date') date?: string) {
    return this.service.getEodReconciliation(date);
  }

  // ── Executive Reports ────────────────────────────────────────────────

  @Get('executive/kpi-dashboard')
  getKpiDashboard() {
    return this.service.getKpiDashboard();
  }

  @Get('executive/profitability')
  getProfitability(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getProfitability(fromDate, toDate);
  }

  @Get('executive/health-scorecard')
  getHealthScorecard() {
    return this.service.getHealthScorecard();
  }

  @Get('executive/trend-forecast')
  getTrendForecast() {
    return this.service.getTrendForecast();
  }

  @Get('executive/comparative')
  getComparativeAnalysis(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getComparativeAnalysis(fromDate, toDate);
  }
}
