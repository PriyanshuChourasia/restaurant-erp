import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../../sales/entities/sales.entity';
import { InvoiceItem } from '../../sales/entities/sales.entity';
import { Item } from '../../items/entities/item.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { Inventory, StockMovement } from '../../inventory/entities/inventory.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { LedgerAccount, LedgerEntry } from '../../ledger/entities/ledger.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
  ) {}

  private getDateRange(fromDate?: string, toDate?: string) {
    const to = toDate || new Date().toISOString().split('T')[0];
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    return { from, to };
  }

  // ── RPT-S01: Daily Sales Summary ──────────────────────────────────────

  async getDailySalesSummary(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'orderCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'totalTax')
      .addSelect('COALESCE(SUM(inv.discount), 0)', 'totalDiscount')
      .addSelect('COALESCE(SUM(inv.subtotal), 0)', 'totalSubtotal')
      .where('inv.invoiceDate = :date', { date: targetDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const paymentBreakdown = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.paymentMethod', 'method')
      .addSelect('COUNT(inv.id)', 'count')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'total')
      .where('inv.invoiceDate = :date', { date: targetDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.paymentMethod')
      .getRawMany();

    return {
      date: targetDate,
      orderCount: Number(result?.orderCount || 0),
      totalSales: Number(result?.totalSales || 0),
      totalTax: Number(result?.totalTax || 0),
      totalDiscount: Number(result?.totalDiscount || 0),
      totalSubtotal: Number(result?.totalSubtotal || 0),
      averageOrderValue: Number(result?.orderCount || 0) > 0
        ? Number(result?.totalSales || 0) / Number(result?.orderCount || 0) : 0,
      paymentBreakdown: paymentBreakdown.map((r: any) => ({
        method: r.method,
        count: Number(r.count),
        total: Number(r.total),
      })),
    };
  }

  // ── RPT-S02: Sales Report (Date Range) ────────────────────────────────

  async getSalesReport(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const result = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'invoiceCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'totalTax')
      .addSelect('COALESCE(SUM(inv.discount), 0)', 'totalDiscount')
      .addSelect('COALESCE(SUM(inv.subtotal), 0)', 'totalSubtotal')
      .addSelect('COALESCE(MIN(inv.grandTotal), 0)', 'minOrder')
      .addSelect('COALESCE(MAX(inv.grandTotal), 0)', 'maxOrder')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const dailyTrend = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.invoiceDate', 'date')
      .addSelect('COUNT(inv.id)', 'orderCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'totalTax')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.invoiceDate')
      .orderBy('inv.invoiceDate', 'ASC')
      .getRawMany();

    const invoiceCount = Number(result?.invoiceCount || 0);
    const totalSales = Number(result?.totalSales || 0);

    return {
      fromDate: from,
      toDate: to,
      invoiceCount,
      totalSales,
      totalTax: Number(result?.totalTax || 0),
      totalDiscount: Number(result?.totalDiscount || 0),
      totalSubtotal: Number(result?.totalSubtotal || 0),
      averageOrderValue: invoiceCount > 0 ? totalSales / invoiceCount : 0,
      minOrder: Number(result?.minOrder || 0),
      maxOrder: Number(result?.maxOrder || 0),
      dailyTrend: dailyTrend.map((r: any) => ({
        date: r.date,
        orderCount: Number(r.orderCount),
        totalSales: Number(r.totalSales),
        totalTax: Number(r.totalTax),
      })),
    };
  }

  // ── RPT-S03: Sales by Payment Method ──────────────────────────────────

  async getSalesByPaymentMethod(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const breakdown = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.paymentMethod', 'method')
      .addSelect('COUNT(inv.id)', 'count')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'total')
      .addSelect('COALESCE(AVG(inv.grandTotal), 0)', 'average')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.paymentMethod')
      .orderBy('total', 'DESC')
      .getRawMany();

    const grandTotal = breakdown.reduce((s: number, r: any) => s + Number(r.total), 0);

    return {
      fromDate: from,
      toDate: to,
      grandTotal,
      methods: breakdown.map((r: any) => ({
        method: r.method,
        count: Number(r.count),
        total: Number(r.total),
        average: Number(r.average),
        percentage: grandTotal > 0 ? (Number(r.total) / grandTotal) * 100 : 0,
      })),
    };
  }

  // ── RPT-S04: Sales by Category ────────────────────────────────────────

  async getSalesByCategory(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const categorySales = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .innerJoin(Item, 'item', 'item.id = ii.itemId')
      .innerJoin(CategoryEntity, 'cat', 'cat.id = item.categoryId')
      .select('cat.id', 'categoryId')
      .addSelect('cat.name', 'categoryName')
      .addSelect('cat.level', 'categoryLevel')
      .addSelect('COALESCE(SUM(ii.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(ii.totalAmount), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('cat.id')
      .addGroupBy('cat.name')
      .addGroupBy('cat.level')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    const grandTotal = categorySales.reduce((s: number, r: any) => s + Number(r.revenue), 0);

    const uncategorized = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .innerJoin(Item, 'item', 'item.id = ii.itemId')
      .select('COALESCE(SUM(ii.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(ii.totalAmount), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .andWhere('item.categoryId IS NULL')
      .getRawOne();

    const categories = categorySales.map((r: any) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryLevel: Number(r.categoryLevel),
      quantitySold: Number(r.quantitySold),
      revenue: Number(r.revenue),
      percentage: grandTotal > 0 ? (Number(r.revenue) / grandTotal) * 100 : 0,
    }));

    if (uncategorized && Number(uncategorized.revenue) > 0) {
      categories.push({
        categoryId: null as any,
        categoryName: 'Uncategorized',
        categoryLevel: 0,
        quantitySold: Number(uncategorized.quantitySold),
        revenue: Number(uncategorized.revenue),
        percentage: grandTotal > 0 ? (Number(uncategorized.revenue) / grandTotal) * 100 : 0,
      });
    }

    return {
      fromDate: from,
      toDate: to,
      grandTotal,
      categories,
    };
  }

  // ── RPT-S05: Popular Items ────────────────────────────────────────────

  async getPopularItems(fromDate?: string, toDate?: string, limit = 20) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const items = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .select('ii.itemId', 'itemId')
      .addSelect('ii.itemName', 'itemName')
      .addSelect('COALESCE(SUM(ii.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(ii.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(DISTINCT ii.invoiceId)', 'timesOrdered')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('ii.itemId')
      .addGroupBy('ii.itemName')
      .orderBy('quantitySold', 'DESC')
      .limit(limit)
      .getRawMany();

    const itemEntities = await this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'cat')
      .getMany();
    const itemMap = new Map(itemEntities.map(i => [i.id, i]));

    return {
      fromDate: from,
      toDate: to,
      items: items.map((r: any, idx: number) => {
        const entity = itemMap.get(r.itemId);
        return {
          rank: idx + 1,
          itemId: r.itemId,
          itemName: r.itemName,
          categoryName: entity?.category?.name || 'Uncategorized',
          isVeg: entity?.isVeg ?? true,
          quantitySold: Number(r.quantitySold),
          revenue: Number(r.revenue),
          timesOrdered: Number(r.timesOrdered),
          avgQuantityPerOrder: Number(r.timesOrdered) > 0
            ? Number(r.quantitySold) / Number(r.timesOrdered) : 0,
        };
      }),
    };
  }

  // ── RPT-S09: GST Report (Enhanced) ───────────────────────────────────

  async getGstReport(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getMany();

    const gstSummary: Record<string, {
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      itemCount: number;
      invoiceCount: number;
    }> = {};

    const invoiceSet = new Set<string>();

    for (const inv of invoices) {
      for (const item of inv.items) {
        const rate = Number(item.gstRate);
        const key = `${rate}%`;
        if (!gstSummary[key]) {
          gstSummary[key] = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, itemCount: 0, invoiceCount: 0 };
        }
        gstSummary[key].taxableValue += Number(item.taxableValue);
        gstSummary[key].cgst += Number(item.cgstAmount);
        gstSummary[key].sgst += Number(item.sgstAmount);
        gstSummary[key].igst += Number(inv.igstTotal || 0) / (inv.items.length || 1);
        gstSummary[key].totalTax += Number(item.cgstAmount) + Number(item.sgstAmount);
        gstSummary[key].itemCount++;
        invoiceSet.add(inv.id);
      }
    }

    const totalTaxable = Object.values(gstSummary).reduce((s, v) => s + v.taxableValue, 0);
    const totalCgst = Object.values(gstSummary).reduce((s, v) => s + v.cgst, 0);
    const totalSgst = Object.values(gstSummary).reduce((s, v) => s + v.sgst, 0);
    const totalTax = Object.values(gstSummary).reduce((s, v) => s + v.totalTax, 0);

    return {
      fromDate: from,
      toDate: to,
      invoiceCount: invoices.length,
      itemCount: Object.values(gstSummary).reduce((s, v) => s + v.itemCount, 0),
      totalTaxable,
      totalCgst,
      totalSgst,
      totalTax,
      gstRateSummary: Object.entries(gstSummary).map(([rate, data]) => ({
        rate,
        ...data,
      })),
    };
  }

  // ── RPT-I01: Current Stock Status ────────────────────────────────────

  async getStockStatus() {
    const stock = await this.inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'cat')
      .orderBy('item.name', 'ASC')
      .getMany();

    const summary = {
      totalItems: stock.length,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      okCount: 0,
    };

    const items = stock.map((s) => {
      const stockValue = Number(s.currentStock) * Number(s.unitCost);
      const isLow = Number(s.currentStock) <= Number(s.minStockLevel) && Number(s.currentStock) > 0;
      const isOut = Number(s.currentStock) <= 0;
      const status = isOut ? 'out_of_stock' : isLow ? 'low' : 'ok';

      summary.totalValue += stockValue;
      if (status === 'low') summary.lowStockCount++;
      else if (status === 'out_of_stock') summary.outOfStockCount++;
      else summary.okCount++;

      return {
        itemId: s.itemId,
        itemName: s.item?.name || 'Unknown',
        sku: s.item?.sku || '',
        unit: s.item?.unit || 'piece',
        categoryName: s.item?.category?.name || 'Uncategorized',
        productType: s.item?.productType || 'finished',
        openingBalance: Number(s.openingBalance),
        currentStock: Number(s.currentStock),
        minStockLevel: Number(s.minStockLevel),
        unitCost: Number(s.unitCost),
        stockValue,
        status,
      };
    });

    return { summary, items };
  }

  // ── RPT-I02: Low Stock Alerts ────────────────────────────────────────

  async getLowStockAlerts() {
    const stock = await this.inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'cat')
      .getMany();

    const lowItems = stock
      .filter(s => Number(s.currentStock) <= Number(s.minStockLevel))
      .map(s => ({
        itemId: s.itemId,
        itemName: s.item?.name || 'Unknown',
        sku: s.item?.sku || '',
        unit: s.item?.unit || 'piece',
        categoryName: s.item?.category?.name || 'Uncategorized',
        currentStock: Number(s.currentStock),
        minStockLevel: Number(s.minStockLevel),
        deficit: Number(s.minStockLevel) - Number(s.currentStock),
        isOut: Number(s.currentStock) <= 0,
      }))
      .sort((a, b) => b.deficit - a.deficit);

    return {
      totalAlerts: lowItems.length,
      outOfStock: lowItems.filter(i => i.isOut).length,
      lowStock: lowItems.filter(i => !i.isOut).length,
      items: lowItems,
    };
  }

  // ── RPT-F01: Balance Sheet ───────────────────────────────────────────

  async getBalanceSheet() {
    const accounts = await this.ledgerAccountRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });

    const enriched = await Promise.all(accounts.map(async (acc) => {
      const totals = await this.ledgerEntryRepo.createQueryBuilder('le')
        .select('COALESCE(SUM(CASE WHEN le.type = \'credit\' THEN le.amount ELSE 0 END)', 'totalCredits')
        .addSelect('COALESCE(SUM(CASE WHEN le.type = \'debit\' THEN le.amount ELSE 0 END)', 'totalDebits')
        .where('le.accountId = :accountId', { accountId: acc.id })
        .getRawOne();

      return {
        id: acc.id,
        name: acc.name,
        description: acc.description,
        openingBalance: Number(acc.openingBalance),
        totalCredits: Number(totals?.totalCredits || 0),
        totalDebits: Number(totals?.totalDebits || 0),
        currentBalance: Number(acc.currentBalance),
      };
    }));

    const totalCredits = enriched.reduce((s, a) => s + a.totalCredits, 0);
    const totalDebits = enriched.reduce((s, a) => s + a.totalDebits, 0);

    return {
      accounts: enriched,
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
    };
  }

  // ── RPT-F02: Profit & Loss Statement ─────────────────────────────────

  async getProfitLoss(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    // Revenue from sales
    const salesResult = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'grossSales')
      .addSelect('COALESCE(SUM(inv.discount), 0)', 'discounts')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'taxCollected')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status = :completed', { completed: InvoiceStatus.COMPLETED })
      .getRawOne();

    const cancelledResult = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'cancelledAmount')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status = :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    // Purchases (COGS approximation)
    const purchaseResult = await this.purchaseRepo.createQueryBuilder('p')
      .select('COALESCE(SUM(p.totalAmount), 0)', 'totalPurchases')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status != :cancelled', { cancelled: 'cancelled' })
      .getRawOne();

    // Inventory value for COGS calculation
    const inventoryResult = await this.inventoryRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.currentStock * inv.unitCost), 0)', 'closingInventoryValue')
      .getRawOne();

    // Operating expenses from ledger
    const expensesResult = await this.ledgerEntryRepo.createQueryBuilder('le')
      .select('le.category', 'category')
      .addSelect('COALESCE(SUM(le.amount), 0)', 'total')
      .where('le.type = :type', { type: 'debit' })
      .andWhere('le.entryDate BETWEEN :from AND :to', { from, to })
      .groupBy('le.category')
      .getRawMany();

    const grossSales = Number(salesResult?.grossSales || 0);
    const discounts = Number(salesResult?.discounts || 0);
    const taxCollected = Number(salesResult?.taxCollected || 0);
    const cancelledAmount = Number(cancelledResult?.cancelledAmount || 0);
    const totalPurchases = Number(purchaseResult?.totalPurchases || 0);
    const closingInventoryValue = Number(inventoryResult?.closingInventoryValue || 0);

    const netRevenue = grossSales - discounts - cancelledAmount;
    const cogs = totalPurchases - closingInventoryValue;
    const grossProfit = netRevenue - cogs;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    const operatingExpenses = expensesResult
      .filter((r: any) => ['expense', 'salary', 'tax', 'miscellaneous'].includes(r.category))
      .reduce((s: number, r: any) => s + Number(r.total), 0);

    const netProfit = grossProfit - operatingExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      fromDate: from,
      toDate: to,
      revenue: {
        grossSales,
        discounts,
        cancelledAmount,
        netRevenue,
      },
      costOfGoodsSold: {
        purchases: totalPurchases,
        closingInventory: closingInventoryValue,
        cogs,
      },
      grossProfit,
      grossMargin,
      operatingExpenses,
      expensesByCategory: expensesResult.map((r: any) => ({
        category: r.category,
        amount: Number(r.total),
      })),
      netProfit,
      netMargin,
    };
  }

  // ── RPT-S06: Hourly Sales Distribution ───────────────────────────────

  async getHourlyDistribution(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const hourlyData = await this.invoiceRepo.createQueryBuilder('inv')
      .select("EXTRACT(HOUR FROM inv.createdAt)", 'hour')
      .addSelect('COUNT(inv.id)', 'orderCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSales')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy("EXTRACT(HOUR FROM inv.createdAt)")
      .orderBy("EXTRACT(HOUR FROM inv.createdAt)", 'ASC')
      .getRawMany();

    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
    const dataMap = new Map(hourlyData.map((r: any) => [Number(r.hour), r]));

    return {
      fromDate: from,
      toDate: to,
      hours: hours.map(h => ({
        hour: h,
        label: `${h}:00`,
        orderCount: Number(dataMap.get(h)?.orderCount || 0),
        totalSales: Number(dataMap.get(h)?.totalSales || 0),
        avgOrderValue: Number(dataMap.get(h)?.orderCount || 0) > 0
          ? Number(dataMap.get(h)?.totalSales || 0) / Number(dataMap.get(h)?.orderCount || 0) : 0,
      })),
    };
  }

  // ── RPT-S12: Veg vs Non-Veg ──────────────────────────────────────────

  async getVegNonVegSplit(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const split = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .innerJoin(Item, 'item', 'item.id = ii.itemId')
      .select('item.isVeg', 'isVeg')
      .addSelect('COALESCE(SUM(ii.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(ii.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(DISTINCT ii.invoiceId)', 'timesOrdered')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('item.isVeg')
      .getRawMany();

    const grandTotal = split.reduce((s: number, r: any) => s + Number(r.revenue), 0);

    return {
      fromDate: from,
      toDate: to,
      grandTotal,
      veg: {
        quantitySold: Number(split.find((r: any) => r.isVeg === true)?.quantitySold || 0),
        revenue: Number(split.find((r: any) => r.isVeg === true)?.revenue || 0),
        percentage: grandTotal > 0
          ? (Number(split.find((r: any) => r.isVeg === true)?.revenue || 0) / grandTotal) * 100 : 0,
      },
      nonVeg: {
        quantitySold: Number(split.find((r: any) => r.isVeg === false)?.quantitySold || 0),
        revenue: Number(split.find((r: any) => r.isVeg === false)?.revenue || 0),
        percentage: grandTotal > 0
          ? (Number(split.find((r: any) => r.isVeg === false)?.revenue || 0) / grandTotal) * 100 : 0,
      },
    };
  }
}
