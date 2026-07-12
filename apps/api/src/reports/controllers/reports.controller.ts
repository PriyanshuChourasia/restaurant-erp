import { Controller, Get, Query } from '@nestjs/common';
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

  // ── Inventory Reports ────────────────────────────────────────────────

  @Get('inventory/stock-status')
  getStockStatus() {
    return this.service.getStockStatus();
  }

  @Get('inventory/low-stock')
  getLowStockAlerts() {
    return this.service.getLowStockAlerts();
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
}
