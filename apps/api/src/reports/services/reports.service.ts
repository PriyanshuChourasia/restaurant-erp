import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from '../../sales/entities/sales.entity';
import { InvoiceItem } from '../../sales/entities/sales.entity';
import { Item } from '../../items/entities/item.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { Inventory, StockMovement, MovementType } from '../../inventory/entities/inventory.entity';
import { StockCount, StockCountLine, StockCountStatus } from '../../inventory/entities/stock-count.entity';
import { Purchase, PurchaseItem, PurchaseStatus } from '../../purchases/entities/purchase.entity';
import { LedgerAccount, LedgerEntry } from '../../ledger/entities/ledger.entity';
import { Kot, KotItem, KotStatus, KotStation } from '../../kot/entities/kot.entity';
import { Reservation, ReservationStatus, ReservationSource } from '../../reservations/entities/reservation.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Table as SeatingTable } from '../../seating/entities/table.entity';
import { Zone } from '../../seating/entities/zone.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';

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
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepo: Repository<PurchaseItem>,
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
    @InjectRepository(Kot)
    private readonly kotRepo: Repository<Kot>,
    @InjectRepository(KotItem)
    private readonly kotItemRepo: Repository<KotItem>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SeatingTable)
    private readonly tableRepo: Repository<SeatingTable>,
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(StockCount)
    private readonly stockCountRepo: Repository<StockCount>,
    @InjectRepository(StockCountLine)
    private readonly stockCountLineRepo: Repository<StockCountLine>,
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
        unit: s.item?.unit?.code || 'piece',
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
        unit: s.item?.unit?.code || 'piece',
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

  // ── RPT-S07: Weekly/Monthly Trends ──────────────────────────────────

  async getSalesTrends(fromDate?: string, toDate?: string, groupBy: 'week' | 'month' = 'week') {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const dateTrunc = groupBy === 'month' ? "DATE_TRUNC('month', inv.invoiceDate)" : "DATE_TRUNC('week', inv.invoiceDate)";

    const raw = await this.invoiceRepo.createQueryBuilder('inv')
      .select(dateTrunc, 'periodStart')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .addSelect('COALESCE(SUM(inv.subtotal), 0)', 'subtotal')
      .addSelect('COALESCE(SUM(inv.discount), 0)', 'discounts')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'tax')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .addSelect('COALESCE(SUM(inv.grandTotal) / NULLIF(COUNT(inv.id), 0), 0)', 'avgOrderValue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('periodStart')
      .orderBy('periodStart', 'ASC')
      .getRawMany();

    const periods: {
      periodStart: string;
      periodLabel: string;
      invoiceCount: number;
      subtotal: number;
      discounts: number;
      tax: number;
      revenue: number;
      avgOrderValue: number;
      change: number | null;
    }[] = [];

    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      const revenue = Number(r.revenue);
      const prevRevenue = i > 0 ? Number(raw[i - 1].revenue) : null;
      const change = prevRevenue && prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

      const date = new Date(r.periodStart);
      const periodLabel = groupBy === 'month'
        ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : `Week ${this.getWeekNumber(date)} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

      periods.push({
        periodStart: r.periodStart,
        periodLabel,
        invoiceCount: Number(r.invoiceCount),
        subtotal: Number(r.subtotal),
        discounts: Number(r.discounts),
        tax: Number(r.tax),
        revenue,
        avgOrderValue: Number(r.avgOrderValue),
        change,
      });
    }

    return {
      fromDate: from,
      toDate: to,
      groupBy,
      totalRevenue: periods.reduce((s, p) => s + p.revenue, 0),
      totalInvoices: periods.reduce((s, p) => s + p.invoiceCount, 0),
      periods,
    };
  }

  // ── RPT-S08: Discount Analysis ──────────────────────────────────────

  async getDiscountAnalysis(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getMany();

    const totalInvoices = invoices.length;
    const totalSubtotal = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
    const totalDiscount = invoices.reduce((s, i) => s + Number(i.discount), 0);
    const discountedInvoices = invoices.filter(i => Number(i.discount) > 0);

    const byPaymentMethod: Record<string, { count: number; discount: number }> = {};

    for (const inv of invoices) {
      const method = inv.paymentMethod || 'unknown';
      if (!byPaymentMethod[method]) byPaymentMethod[method] = { count: 0, discount: 0 };
      byPaymentMethod[method].count++;
      byPaymentMethod[method].discount += Number(inv.discount);
    }

    const highDiscountThreshold = totalInvoices > 0
      ? invoices.reduce((s, i) => s + Number(i.discount), 0) / totalInvoices * 2 : 0;

    const highDiscountInvoices = invoices
      .filter(i => Number(i.discount) > 0 && Number(i.discount) >= highDiscountThreshold)
      .sort((a, b) => Number(b.discount) - Number(a.discount))
      .slice(0, 20)
      .map(i => ({
        invoiceId: i.id,
        invoiceNumber: i.invoiceNumber,
        date: i.invoiceDate,
        customerName: i.customerName || 'Walk-in',
        subtotal: Number(i.subtotal),
        discount: Number(i.discount),
        discountPercent: Number(i.subtotal) > 0
          ? (Number(i.discount) / Number(i.subtotal)) * 100 : 0,
        grandTotal: Number(i.grandTotal),
      }));

    const noDiscountCount = totalInvoices - discountedInvoices.length;

    return {
      fromDate: from,
      toDate: to,
      totalInvoices,
      totalSubtotal,
      totalDiscount,
      avgDiscountPerInvoice: totalInvoices > 0 ? totalDiscount / totalInvoices : 0,
      discountRate: totalSubtotal > 0 ? (totalDiscount / totalSubtotal) * 100 : 0,
      discountDistribution: {
        noDiscount: { count: noDiscountCount, percentage: (noDiscountCount / totalInvoices) * 100 },
        upTo5Percent: { count: 0, percentage: 0 },
        upTo10Percent: { count: 0, percentage: 0 },
        above10Percent: { count: 0, percentage: 0 },
      },
      byPaymentMethod: Object.entries(byPaymentMethod).map(([method, data]) => ({
        method,
        count: data.count,
        totalDiscount: data.discount,
        avgDiscount: data.count > 0 ? data.discount / data.count : 0,
      })),
      highDiscountInvoices,
    };
  }

  // ── RPT-S10: Invoice-Level Drill-Down ───────────────────────────────

  async getInvoiceDrillDown(invoiceId: string) {
    const invoice = await this.invoiceRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.id = :id', { id: invoiceId })
      .getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const taxRateMap: Record<string, { taxableValue: number; cgst: number; sgst: number }> = {};
    for (const item of invoice.items) {
      const rate = `${Number(item.gstRate)}%`;
      if (!taxRateMap[rate]) taxRateMap[rate] = { taxableValue: 0, cgst: 0, sgst: 0 };
      taxRateMap[rate].taxableValue += Number(item.taxableValue);
      taxRateMap[rate].cgst += Number(item.cgstAmount);
      taxRateMap[rate].sgst += Number(item.sgstAmount);
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      status: invoice.status,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerGstin: invoice.customerGstin,
      paymentMethod: invoice.paymentMethod,
      tableIds: invoice.tableIds,
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      cgstTotal: Number(invoice.cgstTotal),
      sgstTotal: Number(invoice.sgstTotal),
      igstTotal: Number(invoice.igstTotal),
      taxTotal: Number(invoice.taxTotal),
      roundOff: Number(invoice.roundOff),
      grandTotal: Number(invoice.grandTotal),
      notes: invoice.notes,
      taxRateSummary: Object.entries(taxRateMap).map(([rate, data]) => ({
        rate,
        ...data,
      })),
      items: invoice.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.itemName,
        hsnCode: item.hsnCode,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxableValue: Number(item.taxableValue),
        gstRate: Number(item.gstRate),
        cgstAmount: Number(item.cgstAmount),
        sgstAmount: Number(item.sgstAmount),
        totalAmount: Number(item.totalAmount),
      })),
    };
  }

  // ── RPT-S11: Cancelled & Voided Transactions ────────────────────────

  async getCancelledTransactions(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status = :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .orderBy('inv.invoiceDate', 'DESC')
      .getMany();

    const totalInvoices = await this.invoiceRepo.createQueryBuilder('inv')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .getCount();

    const cancelledCount = invoices.length;
    const lostRevenue = invoices.reduce((s, i) => s + Number(i.grandTotal), 0);
    const avgLostPerInvoice = cancelledCount > 0 ? lostRevenue / cancelledCount : 0;

    return {
      fromDate: from,
      toDate: to,
      cancelledCount,
      totalInvoices,
      cancelRate: totalInvoices > 0 ? (cancelledCount / totalInvoices) * 100 : 0,
      lostRevenue,
      avgLostPerInvoice,
      invoices: invoices.map(i => ({
        invoiceId: i.id,
        invoiceNumber: i.invoiceNumber,
        invoiceDate: i.invoiceDate,
        customerName: i.customerName || 'Walk-in',
        paymentMethod: i.paymentMethod,
        subtotal: Number(i.subtotal),
        discount: Number(i.discount),
        grandTotal: Number(i.grandTotal),
        notes: i.notes,
      })),
    };
  }

  // ── RPT-I03: Stock Movement Ledger ─────────────────────────────────

  async getStockMovements(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const movements = await this.movementRepo.createQueryBuilder('sm')
      .leftJoinAndSelect(Item, 'item', 'item.id = sm.itemId')
      .select('sm.createdAt', 'date')
      .addSelect('item.name', 'itemName')
      .addSelect('sm.type', 'movementType')
      .addSelect('sm.quantity', 'quantity')
      .addSelect('sm.balanceBefore', 'balanceBefore')
      .addSelect('sm.balanceAfter', 'balanceAfter')
      .addSelect('sm.reference', 'reference')
      .addSelect('sm.notes', 'notes')
      .where('sm.createdAt BETWEEN :from AND :to', { from, to })
      .orderBy('sm.createdAt', 'DESC')
      .getRawMany();

    const uniqueItems = new Set(movements.map((r: any) => r.itemName)).size;

    return {
      fromDate: from,
      toDate: to,
      totalMovements: movements.length,
      uniqueItems,
      items: movements.map((r: any) => ({
        date: r.date,
        itemName: r.itemName || 'Unknown',
        movementType: r.movementType,
        quantity: Number(r.quantity),
        balanceBefore: Number(r.balanceBefore),
        balanceAfter: Number(r.balanceAfter),
        reference: r.reference,
        notes: r.notes,
      })),
    };
  }

  // ── RPT-I04: Stock Valuation ───────────────────────────────────────

  async getStockValuation() {
    const stock = await this.inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'cat')
      .orderBy('item.name', 'ASC')
      .getMany();

    const categories = new Set<string>();
    const items = stock.map((s) => {
      const stockValue = Number(s.currentStock) * Number(s.unitCost);
      categories.add(s.item?.category?.name || 'Uncategorized');
      return {
        itemName: s.item?.name || 'Unknown',
        categoryName: s.item?.category?.name || 'Uncategorized',
        productType: s.item?.productType || 'finished',
        currentStock: Number(s.currentStock),
        unitCost: Number(s.unitCost),
        stockValue,
      };
    });

    return {
      totalValue: items.reduce((s, i) => s + i.stockValue, 0),
      categoryCount: categories.size,
      items,
    };
  }

  // ── RPT-I05: Wastage Report ────────────────────────────────────────

  async getWastageReport(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const wastage = await this.movementRepo.createQueryBuilder('sm')
      .leftJoinAndSelect(Item, 'item', 'item.id = sm.itemId')
      .select('item.name', 'itemName')
      .addSelect('sm.quantity', 'wastageQuantity')
      .addSelect('sm.quantity * inv.unitCost', 'wastageValue')
      .addSelect('sm.notes', 'reason')
      .leftJoin(Inventory, 'inv', 'inv.itemId = sm.itemId')
      .where('sm.type = :type', { type: MovementType.WASTAGE })
      .andWhere('sm.createdAt BETWEEN :from AND :to', { from, to })
      .orderBy('sm.createdAt', 'DESC')
      .getRawMany();

    const totalWastage = wastage.reduce((s: number, r: any) => s + Number(r.wastageValue || 0), 0);
    const totalRevenue = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    return {
      fromDate: from,
      toDate: to,
      totalWastage,
      wastageRate: totalRevenue?.revenue > 0 ? (totalWastage / Number(totalRevenue.revenue)) * 100 : 0,
      items: wastage.map((r: any) => ({
        itemName: r.itemName || 'Unknown',
        wastageQuantity: Number(r.wastageQuantity || 0),
        wastageValue: Number(r.wastageValue || 0),
        reason: r.reason || 'Not specified',
      })),
    };
  }

  // ── RPT-I06: Consumption Analysis ──────────────────────────────────

  async getConsumptionAnalysis(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const consumption = await this.movementRepo.createQueryBuilder('sm')
      .leftJoinAndSelect(Item, 'item', 'item.id = sm.itemId')
      .select('item.name', 'itemName')
      .addSelect('COALESCE(SUM(sm.quantity), 0)', 'totalConsumed')
      .leftJoin(Inventory, 'inv', 'inv.itemId = sm.itemId')
      .addSelect('COALESCE(inv.currentStock, 0)', 'currentStock')
      .where('sm.type IN (:...types)', { types: [MovementType.PRODUCTION_CONSUMPTION, MovementType.SALE_OUT] })
      .andWhere('sm.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('item.name')
      .addGroupBy('inv.currentStock')
      .getRawMany();

    const diffDays = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
    const totalConsumed = consumption.reduce((s: number, r: any) => s + Number(r.totalConsumed), 0);

    return {
      fromDate: from,
      toDate: to,
      totalConsumed,
      avgDailyConsumption: diffDays > 0 ? totalConsumed / diffDays : 0,
      items: consumption.map((r: any) => {
        const avgDaily = Number(r.totalConsumed) / diffDays;
        const currentStock = Number(r.currentStock || 0);
        const daysUntilStockout = avgDaily > 0 ? Math.floor(currentStock / avgDaily) : 999;
        return {
          itemName: r.itemName || 'Unknown',
          totalConsumed: Number(r.totalConsumed),
          avgDaily,
          daysUntilStockout: daysUntilStockout > 999 ? '∞' : String(daysUntilStockout),
        };
      }),
    };
  }

  // ── RPT-I07: Production Report ─────────────────────────────────────

  async getProductionReport(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const production = await this.movementRepo.createQueryBuilder('sm')
      .leftJoinAndSelect(Item, 'item', 'item.id = sm.itemId')
      .select('sm.createdAt', 'date')
      .addSelect('item.name', 'itemName')
      .addSelect('sm.quantity', 'batchQuantity')
      .addSelect('sm.quantity * item.costPrice', 'productionCost')
      .addSelect('u.name', 'createdBy')
      .leftJoin(User, 'u', 'u.id = sm.createdBy')
      .where('sm.type = :type', { type: MovementType.PRODUCTION_YIELD })
      .andWhere('sm.createdAt BETWEEN :from AND :to', { from, to })
      .orderBy('sm.createdAt', 'DESC')
      .getRawMany();

    const totalCost = production.reduce((s: number, r: any) => s + Number(r.productionCost || 0), 0);

    return {
      fromDate: from,
      toDate: to,
      totalBatches: production.length,
      totalCost,
      items: production.map((r: any) => ({
        date: r.date,
        itemName: r.itemName || 'Unknown',
        batchQuantity: Number(r.batchQuantity || 0),
        productionCost: Number(r.productionCost || 0),
        createdBy: r.createdBy || 'System',
      })),
    };
  }

  // ── RPT-I08: Recipe Cost Analysis ──────────────────────────────────

  async getRecipeCosts() {
    const items = await this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'cat')
      .where('item.isActive = :active', { active: true })
      .andWhere('item.productType = :type', { type: 'finished' })
      .getMany();

    const analyzed = items.map((item) => {
      const costPrice = Number(item.costPrice);
      const sellingPrice = Number(item.price);
      const foodCostPercent = sellingPrice > 0 ? (costPrice / sellingPrice) * 100 : 0;
      return {
        itemName: item.name,
        categoryName: item.category?.name || 'Uncategorized',
        totalIngredientCost: costPrice,
        costPerUnit: costPrice,
        sellingPrice,
        foodCostPercent,
        grossMargin: sellingPrice - costPrice,
      };
    });

    const avgFoodCost = analyzed.length > 0
      ? analyzed.reduce((s, i) => s + i.foodCostPercent, 0) / analyzed.length : 0;

    return {
      totalItems: analyzed.length,
      avgFoodCost,
      items: analyzed,
    };
  }

  // ── RPT-I09: Stock Reconciliation ──────────────────────────────────

  async getStockReconciliation() {
    const stock = await this.inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.item', 'item')
      .orderBy('item.name', 'ASC')
      .getMany();

    // Get the most recent completed stock count lines with real variances
    const latestCount = await this.stockCountRepo.findOne({
      where: { status: StockCountStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });
    const countLines = latestCount
      ? await this.stockCountLineRepo.find({
          where: { stockCountId: latestCount.id },
        })
      : [];

    const countMap = new Map(countLines.map((l) => [l.itemId, l]));

    const items = stock.map((s) => {
      const systemStock = Number(s.currentStock);
      const line = countMap.get(s.itemId);
      const physicalCount = line?.countedQuantity ?? systemStock;
      const variance = line?.variance ?? 0;
      const varianceValue = variance * Number(s.unitCost);
      return {
        itemName: s.item?.name || 'Unknown',
        systemStock,
        physicalCount,
        variance,
        varianceValue,
      };
    });

    return {
      totalItems: items.length,
      itemsWithVariance: items.filter((i) => i.variance !== 0).length,
      items,
    };
  }

  // ── RPT-I10: Purchase Timeline ─────────────────────────────────────

  async getPurchaseTimeline(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const purchases = await this.purchaseRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .select('p.purchaseNumber', 'purchaseNumber')
      .addSelect('p.purchaseDate', 'orderDate')
      .addSelect('supplier.name', 'supplierName')
      .addSelect('p.createdAt', 'receivedDate')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status != :cancelled', { cancelled: PurchaseStatus.CANCELLED })
      .orderBy('p.purchaseDate', 'DESC')
      .getRawMany();

    const items = purchases.map((r: any) => {
      const orderDate = new Date(r.orderDate);
      const receivedDate = new Date(r.receivedDate);
      const leadTime = Math.round((receivedDate.getTime() - orderDate.getTime()) / 86400000);
      return {
        purchaseNumber: r.purchaseNumber,
        orderDate: r.orderDate,
        supplierName: r.supplierName || 'Unknown',
        receivedDate: r.receivedDate,
        leadTime: Math.max(0, leadTime),
      };
    });

    const avgLeadTime = items.length > 0
      ? items.reduce((s, i) => s + i.leadTime, 0) / items.length : 0;

    return {
      fromDate: from,
      toDate: to,
      totalOrders: items.length,
      avgLeadTime,
      items,
    };
  }

  // ── RPT-F03: Cash Flow Statement ───────────────────────────────────

  async getCashFlow(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const entries = await this.ledgerEntryRepo.createQueryBuilder('le')
      .leftJoinAndSelect('le.account', 'account')
      .select('account.name', 'accountName')
      .addSelect('le.category', 'category')
      .addSelect('le.type', 'type')
      .addSelect('COALESCE(SUM(le.amount), 0)', 'amount')
      .where('le.entryDate BETWEEN :from AND :to', { from, to })
      .groupBy('account.name')
      .addGroupBy('le.category')
      .addGroupBy('le.type')
      .getRawMany();

    const inflows = entries.filter((r: any) => r.type === 'credit');
    const outflows = entries.filter((r: any) => r.type === 'debit');
    const operatingCashFlow = inflows.reduce((s: number, r: any) => s + Number(r.amount), 0)
      - outflows.reduce((s: number, r: any) => s + Number(r.amount), 0);

    return {
      fromDate: from,
      toDate: to,
      operatingCashFlow,
      netChange: operatingCashFlow,
      items: entries.map((r: any) => ({
        activity: r.accountName || r.category || 'General',
        category: r.category || 'uncategorized',
        amount: r.type === 'credit' ? Number(r.amount) : -Number(r.amount),
      })),
    };
  }

  // ── RPT-F04: GST Return ────────────────────────────────────────────

  async getGstReturn(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const invoiceItems = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .select('ii.gstRate', 'gstRate')
      .addSelect('COALESCE(SUM(ii.taxableValue), 0)', 'taxableValue')
      .addSelect('COALESCE(SUM(ii.cgstAmount), 0)', 'cgst')
      .addSelect('COALESCE(SUM(ii.sgstAmount), 0)', 'sgst')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('ii.gstRate')
      .orderBy('ii.gstRate', 'ASC')
      .getRawMany();

    const totalGstCollected = invoiceItems.reduce((s: number, r: any) => s + Number(r.cgst) + Number(r.sgst), 0);
    const purchaseItc = await this.purchaseItemRepo.createQueryBuilder('pi')
      .innerJoin('pi.purchase', 'p')
      .select('COALESCE(SUM(CAST(pi.totalPrice AS DECIMAL) - CAST(pi.totalPrice AS DECIMAL) / (1 + CAST(pi.gstRate AS DECIMAL) / 100)), 0)', 'itc')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status = :received', { received: 'received' })
      .getRawOne();
    const totalItc = Number(purchaseItc?.itc || 0);
    const netPayable = totalGstCollected - totalItc;

    return {
      fromDate: from,
      toDate: to,
      totalGstCollected,
      totalItc,
      netPayable,
      items: invoiceItems.map((r: any) => ({
        rate: `${Number(r.gstRate)}%`,
        taxableValue: Number(r.taxableValue),
        cgst: Number(r.cgst),
        sgst: Number(r.sgst),
        totalTax: Number(r.cgst) + Number(r.sgst),
      })),
    };
  }

  // ── RPT-F05: Expense Report ────────────────────────────────────────

  async getExpenses(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const expenses = await this.ledgerEntryRepo.createQueryBuilder('le')
      .select('le.category', 'category')
      .addSelect('le.description', 'description')
      .addSelect('le.entryDate', 'date')
      .addSelect('le.amount', 'amount')
      .where('le.type = :type', { type: 'debit' })
      .andWhere('le.entryDate BETWEEN :from AND :to', { from, to })
      .orderBy('le.entryDate', 'DESC')
      .getRawMany();

    const totalExpenses = expenses.reduce((s: number, r: any) => s + Number(r.amount), 0);

    return {
      fromDate: from,
      toDate: to,
      totalExpenses,
      categoryCount: new Set(expenses.map((r: any) => r.category)).size,
      items: expenses.map((r: any) => ({
        category: r.category || 'Uncategorized',
        description: r.description || '',
        date: r.date,
        amount: Number(r.amount),
        percentage: totalExpenses > 0 ? (Number(r.amount) / totalExpenses) * 100 : 0,
      })),
    };
  }

  // ── RPT-F06: Revenue vs Expense ────────────────────────────────────

  async getRevenueVsExpense(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const revenue = await this.invoiceRepo.createQueryBuilder('inv')
      .select("TO_CHAR(inv.invoiceDate, 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'amount')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy("TO_CHAR(inv.invoiceDate, 'YYYY-MM')")
      .orderBy('period', 'ASC')
      .getRawMany();

    const expenses = await this.ledgerEntryRepo.createQueryBuilder('le')
      .select("TO_CHAR(le.entryDate, 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(le.amount), 0)', 'amount')
      .where('le.type = :type', { type: 'debit' })
      .andWhere('le.entryDate BETWEEN :from AND :to', { from, to })
      .groupBy("TO_CHAR(le.entryDate, 'YYYY-MM')")
      .orderBy('period', 'ASC')
      .getRawMany();

    const revenueMap = new Map(revenue.map((r: any) => [r.period, Number(r.amount)]));
    const expenseMap = new Map(expenses.map((r: any) => [r.period, Number(r.amount)]));
    const allPeriods = new Set([...revenueMap.keys(), ...expenseMap.keys()]);

    const items = [...allPeriods].sort().map((period) => ({
      period,
      revenue: revenueMap.get(period) || 0,
      expenses: expenseMap.get(period) || 0,
      netIncome: (revenueMap.get(period) || 0) - (expenseMap.get(period) || 0),
    }));

    return {
      fromDate: from,
      toDate: to,
      totalRevenue: items.reduce((s, i) => s + i.revenue, 0),
      totalExpenses: items.reduce((s, i) => s + i.expenses, 0),
      netIncome: items.reduce((s, i) => s + i.netIncome, 0),
      items,
    };
  }

  // ── RPT-F07: Tax Summary ───────────────────────────────────────────

  async getTaxSummary(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const invoiceTax = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.cgstTotal), 0)', 'cgstCollected')
      .addSelect('COALESCE(SUM(inv.sgstTotal), 0)', 'sgstCollected')
      .addSelect('COALESCE(SUM(inv.igstTotal), 0)', 'igstCollected')
      .addSelect('COALESCE(SUM(inv.taxTotal), 0)', 'totalTaxCollected')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const cgst = Number(invoiceTax?.cgstCollected || 0);
    const sgst = Number(invoiceTax?.sgstCollected || 0);
    const igst = Number(invoiceTax?.igstCollected || 0);

    // ITC from purchases
    const purchaseItc = await this.purchaseItemRepo.createQueryBuilder('pi')
      .innerJoin('pi.purchase', 'p')
      .select('COALESCE(SUM(CAST(pi.totalPrice AS DECIMAL) - CAST(pi.totalPrice AS DECIMAL) / (1 + CAST(pi.gstRate AS DECIMAL) / 100)), 0)', 'itc')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status = :received', { received: 'received' })
      .getRawOne();
    const itc = Number(purchaseItc?.itc || 0);
    const cgstPaid = itc / 2;
    const sgstPaid = itc / 2;

    return {
      fromDate: from,
      toDate: to,
      cgstCollected: cgst,
      sgstCollected: sgst,
      igstCollected: igst,
      totalTaxCollected: cgst + sgst + igst,
      netGstLiability: cgst + sgst - itc / 2,
      items: [
        { taxType: 'CGST', collected: cgst, paid: cgstPaid, netLiability: cgst - cgstPaid },
        { taxType: 'SGST', collected: sgst, paid: sgstPaid, netLiability: sgst - sgstPaid },
        { taxType: 'IGST', collected: igst, paid: 0, netLiability: igst },
      ],
    };
  }

  // ── RPT-F08: Ledger Statement ──────────────────────────────────────

  async getLedgerStatement(accountId?: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const qb = this.ledgerEntryRepo.createQueryBuilder('le')
      .leftJoinAndSelect('le.account', 'account')
      .select('le.entryDate', 'date')
      .addSelect('le.type', 'type')
      .addSelect('le.description', 'description')
      .addSelect('le.amount', 'amount')
      .addSelect('account.name', 'accountName');

    const accountCondition = accountId ? 'le.accountId = :accountId' : '1=1';

    // Compute opening balance from all entries before the range
    const priorBalance = await this.ledgerEntryRepo.createQueryBuilder('le')
      .select(
        `COALESCE(SUM(CASE WHEN le.type = 'credit' THEN le.amount ELSE -le.amount END), 0)`,
        'balance',
      )
      .where('le.entryDate < :from', { from })
      .andWhere(accountCondition, accountId ? { accountId } : {})
      .getRawOne();

    const openingBalance = Number(priorBalance?.balance || 0);

    if (accountId) {
      qb.where('le.accountId = :accountId', { accountId });
    }
    qb.andWhere('le.entryDate BETWEEN :from AND :to', { from, to });
    qb.orderBy('le.entryDate', 'ASC');

    const entries = await qb.getRawMany();

    let runningBalance = openingBalance;
    const items = entries.map((r: any) => {
      const amount = Number(r.amount);
      runningBalance += r.type === 'credit' ? amount : -amount;
      return {
        date: r.date,
        type: r.type,
        description: r.description || r.accountName || '',
        amount,
        balanceAfter: runningBalance,
      };
    });

    const totalCredits = entries.filter((r: any) => r.type === 'credit')
      .reduce((s: number, r: any) => s + Number(r.amount), 0);
    const totalDebits = entries.filter((r: any) => r.type === 'debit')
      .reduce((s: number, r: any) => s + Number(r.amount), 0);

    return {
      fromDate: from,
      toDate: to,
      openingBalance,
      closingBalance: openingBalance + totalCredits - totalDebits,
      totalCredits,
      totalDebits,
      items,
    };
  }

  // ── RPT-K01: Kitchen Queue Status ──────────────────────────────────

  async getKitchenQueueStatus() {
    const kots = await this.kotRepo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items')
      .orderBy('kot.createdAt', 'DESC')
      .getMany();

    const now = new Date();
    const pending = kots.filter((k) => k.status === KotStatus.PENDING);
    const preparing = kots.filter((k) => k.status === KotStatus.PREPARING);
    const ready = kots.filter((k) => k.status === KotStatus.READY);
    const overdue = kots.filter((k) => {
      if (k.status === KotStatus.PENDING || k.status === KotStatus.PREPARING) {
        const elapsed = (now.getTime() - k.createdAt.getTime()) / 60000;
        return elapsed > 15;
      }
      return false;
    });

    return {
      pending: pending.length,
      preparing: preparing.length,
      ready: ready.length,
      overdue: overdue.length,
      items: kots.slice(0, 50).map((k) => {
        const elapsed = Math.round((now.getTime() - k.createdAt.getTime()) / 60000);
        return {
          kotNumber: k.kotNumber,
          station: k.station,
          tables: k.tableIds?.join(', ') || '',
          itemCount: k.items?.length || 0,
          status: k.status,
          elapsedMinutes: elapsed,
        };
      }),
    };
  }

  // ── RPT-K02: Kitchen Performance ───────────────────────────────────

  async getKitchenPerformance(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const kots = await this.kotRepo.createQueryBuilder('kot')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('kot.status IN (:...statuses)', { statuses: [KotStatus.READY, KotStatus.SERVED] })
      .getMany();

    const stationStats: Record<string, { prep: number[]; cook: number[]; total: number[]; count: number }> = {};

    for (const kot of kots) {
      const station = kot.station || 'main_kitchen';
      if (!stationStats[station]) stationStats[station] = { prep: [], cook: [], total: [], count: 0 };
      stationStats[station].count++;

      if (kot.startedAt && kot.createdAt) {
        const prepTime = (kot.startedAt.getTime() - kot.createdAt.getTime()) / 60000;
        stationStats[station].prep.push(prepTime);
      }
      if (kot.completedAt && kot.startedAt) {
        const cookTime = (kot.completedAt.getTime() - kot.startedAt.getTime()) / 60000;
        stationStats[station].cook.push(cookTime);
      }
      if (kot.completedAt && kot.createdAt) {
        const totalTime = (kot.completedAt.getTime() - kot.createdAt.getTime()) / 60000;
        stationStats[station].total.push(totalTime);
      }
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const items = Object.entries(stationStats).map(([station, stats]) => ({
      station,
      avgPrepTime: Math.round(avg(stats.prep) * 10) / 10,
      avgCookTime: Math.round(avg(stats.cook) * 10) / 10,
      avgTotalTime: Math.round(avg(stats.total) * 10) / 10,
      orderCount: stats.count,
    }));

    const allPrep = kots.filter(k => k.startedAt && k.createdAt)
      .map(k => (k.startedAt!.getTime() - k.createdAt.getTime()) / 60000);
    const allCook = kots.filter(k => k.completedAt && k.startedAt)
      .map(k => (k.completedAt!.getTime() - k.startedAt!.getTime()) / 60000);
    const allTotal = kots.filter(k => k.completedAt && k.createdAt)
      .map(k => (k.completedAt!.getTime() - k.createdAt.getTime()) / 60000);

    return {
      fromDate: from,
      toDate: to,
      avgPrepTime: Math.round(avg(allPrep) * 10) / 10,
      avgCookTime: Math.round(avg(allCook) * 10) / 10,
      avgTotalTime: Math.round(avg(allTotal) * 10) / 10,
      items,
    };
  }

  // ── RPT-K03: Station Load ──────────────────────────────────────────

  async getKitchenStationLoad(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const kots = await this.kotRepo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .getMany();

    const stationMap: Record<string, { orderCount: number; itemCount: number; pending: number }> = {};

    for (const kot of kots) {
      const station = kot.station || 'main_kitchen';
      if (!stationMap[station]) stationMap[station] = { orderCount: 0, itemCount: 0, pending: 0 };
      stationMap[station].orderCount++;
      stationMap[station].itemCount += kot.items?.length || 0;
      if (kot.status === KotStatus.PENDING || kot.status === KotStatus.PREPARING) stationMap[station].pending++;
    }

    const maxOrders = Math.max(...Object.values(stationMap).map(s => s.orderCount), 1);
    const items = Object.entries(stationMap).map(([station, stats]) => ({
      station,
      orderCount: stats.orderCount,
      itemCount: stats.itemCount,
      pending: stats.pending,
      utilization: Math.round((stats.orderCount / maxOrders) * 10000) / 100,
    }));

    const busiest = items.reduce((max, i) => i.orderCount > max.orderCount ? i : max, items[0] || { station: '', orderCount: 0 } as any);

    return {
      fromDate: from,
      toDate: to,
      totalOrders: kots.length,
      busiestStation: busiest.station,
      items,
    };
  }

  // ── RPT-K04: Item Frequency ────────────────────────────────────────

  async getKitchenItemFrequency(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const items = await this.kotItemRepo.createQueryBuilder('ki')
      .innerJoin('ki.kot', 'kot')
      .select('ki.itemName', 'itemName')
      .addSelect('COUNT(DISTINCT ki.kotId)', 'timesOrdered')
      .addSelect('COALESCE(SUM(ki.quantity), 0)', 'totalQuantity')
      .addSelect('kot.station', 'station')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('kot.status != :cancelled', { cancelled: KotStatus.CANCELLED })
      .groupBy('ki.itemName')
      .addGroupBy('kot.station')
      .orderBy('timesOrdered', 'DESC')
      .getRawMany();

    return {
      fromDate: from,
      toDate: to,
      uniqueItems: new Set(items.map((r: any) => r.itemName)).size,
      totalOrdered: items.reduce((s: number, r: any) => s + Number(r.totalQuantity), 0),
      items: items.map((r: any) => ({
        itemName: r.itemName,
        timesOrdered: Number(r.timesOrdered),
        totalQuantity: Number(r.totalQuantity),
        station: r.station || 'main_kitchen',
      })),
    };
  }

  // ── RPT-K05: KOT Cancellation ──────────────────────────────────────

  async getKitchenCancellation(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const total = await this.kotRepo.count({ where: { createdAt: Between(new Date(from), new Date(to + 'T23:59:59')) } });

    const cancelled = await this.kotRepo.createQueryBuilder('kot')
      .select('kot.station', 'station')
      .addSelect('COUNT(kot.id)', 'cancelledCount')
      .where('kot.status = :cancelled', { cancelled: KotStatus.CANCELLED })
      .andWhere('kot.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('kot.station')
      .getRawMany();

    return {
      fromDate: from,
      toDate: to,
      cancelledCount: cancelled.reduce((s: number, r: any) => s + Number(r.cancelledCount), 0),
      cancelRate: total > 0
        ? (cancelled.reduce((s: number, r: any) => s + Number(r.cancelledCount), 0) / total) * 100 : 0,
      items: cancelled.map((r: any) => ({
        station: r.station,
        cancelledCount: Number(r.cancelledCount),
        cancelRate: total > 0 ? (Number(r.cancelledCount) / total) * 100 : 0,
      })),
    };
  }

  // ── RPT-K06: Throughput ────────────────────────────────────────────

  async getKitchenThroughput(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const kots = await this.kotRepo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items')
      .select("TO_CHAR(kot.createdAt, 'YYYY-MM-DD HH24')", 'period')
      .addSelect('COUNT(kot.id)', 'ordersCompleted')
      .addSelect('COALESCE(SUM(COALESCE(items.quantity, 0)), 0)', 'itemsPrepared')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('kot.status IN (:...done)', { done: [KotStatus.READY, KotStatus.SERVED] })
      .groupBy("TO_CHAR(kot.createdAt, 'YYYY-MM-DD HH24')")
      .orderBy('period', 'ASC')
      .getRawMany();

    const items = kots.map((r: any) => {
      const ordersCompleted = Number(r.ordersCompleted);
      return {
        period: r.period,
        ordersCompleted,
        itemsPrepared: Number(r.itemsPrepared),
        throughputRate: ordersCompleted, // orders completed per hour
      };
    });

    const rates = items.map(i => i.ordersCompleted);

    return {
      fromDate: from,
      toDate: to,
      peakThroughput: Math.max(...rates, 0),
      avgThroughput: rates.length > 0 ? rates.reduce((s, v) => s + v, 0) / rates.length : 0,
      items,
    };
  }

  // ── RPT-K07: Dietary Mix ──────────────────────────────────────────

  async getKitchenDietaryMix(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const mix = await this.kotItemRepo.createQueryBuilder('ki')
      .innerJoin('ki.kot', 'kot')
      .innerJoin(Item, 'item', 'item.id = ki.itemId')
      .select('item.isVeg', 'isVeg')
      .addSelect('COALESCE(SUM(ki.quantity), 0)', 'itemCount')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('kot.status != :cancelled', { cancelled: KotStatus.CANCELLED })
      .groupBy('item.isVeg')
      .getRawMany();

    const vegCount = Number(mix.find((r: any) => r.isVeg === true)?.itemCount || 0);
    const nonVegCount = Number(mix.find((r: any) => r.isVeg === false)?.itemCount || 0);
    const total = vegCount + nonVegCount;

    return {
      fromDate: from,
      toDate: to,
      vegPercentage: total > 0 ? (vegCount / total) * 100 : 0,
      nonVegPercentage: total > 0 ? (nonVegCount / total) * 100 : 0,
      items: [
        { category: 'Veg', itemCount: vegCount, percentage: total > 0 ? (vegCount / total) * 100 : 0 },
        { category: 'Non-Veg', itemCount: nonVegCount, percentage: total > 0 ? (nonVegCount / total) * 100 : 0 },
      ],
    };
  }

  // ── RPT-C01: Customer Directory ────────────────────────────────────

  async getCustomerDirectory() {
    const customers = await this.customerRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    const invoiceStats = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('COUNT(inv.id)', 'totalVisits')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSpend')
      .addSelect('MAX(inv.invoiceDate)', 'lastVisit')
      .where('inv.customerPhone IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerPhone')
      .getRawMany();

    const statsMap = new Map(invoiceStats.map((r: any) => [r.phone, r]));

    const items = customers.map((c) => {
      const stats = statsMap.get(c.phone);
      const totalVisits = Number(stats?.totalVisits || 0);
      const totalSpend = Number(stats?.totalSpend || 0);
      return {
        customerName: c.name,
        phone: c.phone,
        customerType: c.customerType,
        totalVisits,
        totalSpend,
        avgOrderValue: totalVisits > 0 ? totalSpend / totalVisits : 0,
        lastVisit: stats?.lastVisit || null,
      };
    });

    return {
      totalCustomers: items.length,
      activeCustomers: items.filter((i) => i.lastVisit).length,
      avgSpend: items.length > 0 ? items.reduce((s, i) => s + i.totalSpend, 0) / items.length : 0,
      items,
    };
  }

  // ── RPT-C02: Customer Revenue ──────────────────────────────────────

  async getCustomerRevenue(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const customers = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerName', 'customerName')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalRevenue')
      .addSelect('COUNT(inv.id)', 'orderCount')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .andWhere('inv.customerName IS NOT NULL')
      .groupBy('inv.customerName')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    const grandTotal = customers.reduce((s: number, r: any) => s + Number(r.totalRevenue), 0);
    const top10Count = Math.max(1, Math.ceil(customers.length * 0.1));
    const top10Total = customers.slice(0, top10Count).reduce((s: number, r: any) => s + Number(r.totalRevenue), 0);

    return {
      fromDate: from,
      toDate: to,
      topCustomerRevenue: Number(customers[0]?.totalRevenue || 0),
      top10PercentShare: grandTotal > 0 ? (top10Total / grandTotal) * 100 : 0,
      items: customers.map((r: any) => ({
        customerName: r.customerName || 'Unknown',
        totalRevenue: Number(r.totalRevenue),
        revenueShare: grandTotal > 0 ? (Number(r.totalRevenue) / grandTotal) * 100 : 0,
        orderCount: Number(r.orderCount),
      })),
    };
  }

  // ── RPT-C03: Customer Loyalty ──────────────────────────────────────

  async getCustomerLoyalty() {
    const invoiceStats = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('inv.customerName', 'customerName')
      .addSelect('MIN(inv.invoiceDate)', 'firstVisit')
      .addSelect('MAX(inv.invoiceDate)', 'lastVisit')
      .addSelect('COUNT(inv.id)', 'totalVisits')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSpend')
      .where('inv.customerPhone IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerPhone')
      .addGroupBy('inv.customerName')
      .getRawMany();

    const now = new Date();
    const repeatCustomers = invoiceStats.filter((r: any) => Number(r.totalVisits) > 1);
    const totalCustomers = invoiceStats.length;
    const churnRisk = invoiceStats.filter((r: any) => {
      const lastVisit = new Date(r.lastVisit);
      const daysSince = (now.getTime() - lastVisit.getTime()) / 86400000;
      return daysSince > 90;
    });

    const items = invoiceStats.map((r: any) => {
      const firstVisit = new Date(r.firstVisit);
      const tenureDays = Math.round((now.getTime() - firstVisit.getTime()) / 86400000);
      const totalVisits = Number(r.totalVisits);
      const totalSpend = Number(r.totalSpend);
      const recency = Math.round((now.getTime() - new Date(r.lastVisit).getTime()) / 86400000);
      const frequency = totalVisits;
      const monetary = totalSpend;
      const rfmScore = Math.round((Math.max(0, 5 - recency / 30) + Math.min(frequency, 5) + Math.min(monetary / 1000, 5)) / 3 * 10) / 10;
      return {
        customerName: r.customerName || 'Unknown',
        phone: r.phone,
        firstVisit: r.firstVisit,
        lastVisit: r.lastVisit,
        totalVisits,
        rfmScore,
      };
    });

    const avgTenureDays = items.length > 0
      ? Math.round(items.reduce((s, i) => {
          const days = (now.getTime() - new Date(i.firstVisit || now).getTime()) / 86400000;
          return s + Math.max(0, days);
        }, 0) / items.length) : 0;

    return {
      repeatRate: totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0,
      churnRisk: churnRisk.length,
      avgTenureDays,
      items,
    };
  }

  // ── RPT-C04: New vs Returning ─────────────────────────────────────

  async getNewVsReturning(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .select("TO_CHAR(inv.invoiceDate, 'YYYY-MM')", 'period')
      .addSelect('inv.customerPhone', 'phone')
      .addSelect('inv.customerName', 'customerName')
      .addSelect('inv.grandTotal', 'grandTotal')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .andWhere('inv.customerPhone IS NOT NULL')
      .orderBy('inv.invoiceDate', 'ASC')
      .getRawMany();

    const periodMap: Record<string, { newCustomers: Set<string>; returningCustomers: Set<string>; newRevenue: number; returningRevenue: number }> = {};
    const allPhonePeriods: Record<string, string> = {};

    for (const inv of invoices) {
      const period = inv.period;
      const phone = inv.phone;
      if (!periodMap[period]) periodMap[period] = { newCustomers: new Set(), returningCustomers: new Set(), newRevenue: 0, returningRevenue: 0 };
      if (allPhonePeriods[phone] && allPhonePeriods[phone] < period) {
        periodMap[period].returningCustomers.add(phone);
        periodMap[period].returningRevenue += Number(inv.grandTotal);
      } else {
        periodMap[period].newCustomers.add(phone);
        periodMap[period].newRevenue += Number(inv.grandTotal);
      }
      if (!allPhonePeriods[phone]) allPhonePeriods[phone] = period;
    }

    const items = Object.entries(periodMap).sort().map(([period, data]) => ({
      period,
      newCustomers: data.newCustomers.size,
      returningCustomers: data.returningCustomers.size,
      newRevenue: data.newRevenue,
      returningRevenue: data.returningRevenue,
    }));

    const totalNew = items.reduce((s, i) => s + i.newCustomers, 0);
    const totalReturning = items.reduce((s, i) => s + i.returningCustomers, 0);

    return {
      fromDate: from,
      toDate: to,
      newCustomers: totalNew,
      returningCustomers: totalReturning,
      retentionRate: (totalNew + totalReturning) > 0 ? (totalReturning / (totalNew + totalReturning)) * 100 : 0,
      items,
    };
  }

  // ── RPT-C05: Customer Type Analysis ────────────────────────────────

  async getCustomerTypeAnalysis() {
    const customers = await this.customerRepo.find({ where: { isActive: true } });
    const invoiceStats = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('COUNT(inv.id)', 'orderCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSpend')
      .where('inv.customerPhone IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerPhone')
      .getRawMany();

    const statsMap = new Map(invoiceStats.map((r: any) => [r.phone, r]));
    const typeMap: Record<string, { customerCount: number; totalRevenue: number; totalOrders: number }> = {};

    for (const c of customers) {
      const type = c.customerType || 'regular';
      if (!typeMap[type]) typeMap[type] = { customerCount: 0, totalRevenue: 0, totalOrders: 0 };
      typeMap[type].customerCount++;
      const stats = statsMap.get(c.phone);
      if (stats) {
        typeMap[type].totalRevenue += Number(stats.totalSpend);
        typeMap[type].totalOrders += Number(stats.orderCount);
      }
    }

    const totalRevenue = Object.values(typeMap).reduce((s, d) => s + d.totalRevenue, 0);
    const totalOrders = Object.values(typeMap).reduce((s, d) => s + d.totalOrders, 0);

    return {
      segmentCount: Object.keys(typeMap).length,
      avgAov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      items: Object.entries(typeMap).map(([customerType, data]) => ({
        customerType,
        customerCount: data.customerCount,
        totalRevenue: data.totalRevenue,
        avgOrderValue: data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0,
      })),
    };
  }

  // ── RPT-C06: Customer Lifetime Value ───────────────────────────────

  async getCustomerLifetimeValue() {
    const invoiceStats = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('inv.customerName', 'customerName')
      .addSelect('MIN(inv.invoiceDate)', 'firstVisit')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalSpend')
      .where('inv.customerPhone IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerPhone')
      .addGroupBy('inv.customerName')
      .getRawMany();

    const now = new Date();
    const items = invoiceStats.map((r: any) => {
      const firstVisit = new Date(r.firstVisit);
      const tenureMs = now.getTime() - firstVisit.getTime();
      const tenureMonths = Math.max(1, tenureMs / (30 * 86400000));
      const totalSpend = Number(r.totalSpend);
      const monthlyAvg = totalSpend / tenureMonths;
      return {
        customerName: r.customerName || 'Unknown',
        phone: r.phone,
        tenureMonths: Math.round(tenureMonths),
        totalSpend,
        monthlyAvg: Math.round(monthlyAvg * 100) / 100,
        projectedAnnual: Math.round(monthlyAvg * 12 * 100) / 100,
      };
    });

    const sorted = [...items].sort((a, b) => b.totalSpend - a.totalSpend);
    const top25Percent = Math.max(1, Math.ceil(sorted.length * 0.25));

    return {
      avgClv: items.length > 0 ? items.reduce((s, i) => s + i.monthlyAvg, 0) / items.length : 0,
      highValueCount: top25Percent,
      items: sorted,
    };
  }

  // ── RPT-C07: Customer Preferences ──────────────────────────────────

  async getCustomerPreferences() {
    const invoiceItems = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .select('inv.customerName', 'customerName')
      .addSelect('ii.itemName', 'itemName')
      .addSelect('COALESCE(SUM(ii.quantity), 0)', 'totalQty')
      .addSelect('COUNT(DISTINCT ii.invoiceId)', 'orderCount')
      .where('inv.customerName IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerName')
      .addGroupBy('ii.itemName')
      .orderBy('inv.customerName', 'ASC')
      .addOrderBy('totalQty', 'DESC')
      .getRawMany();

    // Fetch each customer's most common order hour
    const customerHours = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerName', 'customerName')
      .addSelect("EXTRACT(HOUR FROM inv.createdAt)", 'orderHour')
      .addSelect('COUNT(inv.id)', 'cnt')
      .where('inv.customerName IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerName')
      .addGroupBy('EXTRACT(HOUR FROM inv.createdAt)')
      .orderBy('inv.customerName', 'ASC')
      .addOrderBy('cnt', 'DESC')
      .getRawMany();

    const preferredHourMap = new Map<string, number>();
    for (const r of customerHours) {
      const name = r.customerName;
      if (!preferredHourMap.has(name)) {
        preferredHourMap.set(name, Number(r.orderHour));
      }
    }

    const customerMap: Record<string, { items: any[]; totalOrders: number }> = {};
    for (const r of invoiceItems) {
      const name = r.customerName;
      if (!customerMap[name]) customerMap[name] = { items: [], totalOrders: 0 };
      customerMap[name].items.push({ itemName: r.itemName, totalQty: Number(r.totalQty), orderCount: Number(r.orderCount) });
      customerMap[name].totalOrders += Number(r.orderCount);
    }

    const items = Object.entries(customerMap).map(([customerName, data]) => {
      const sorted = data.items.sort((a, b) => b.totalQty - a.totalQty);
      const categories = [...new Set(sorted.map(i => i.itemName))];
      const avgItemsPerOrder = data.totalOrders > 0
        ? sorted.reduce((s, i) => s + i.totalQty, 0) / data.totalOrders : 0;
      const hour = preferredHourMap.get(customerName);
      const hourStr = hour !== undefined ? `${hour}:00` : 'N/A';
      return {
        customerName,
        favoriteItem: sorted[0]?.itemName || 'N/A',
        preferredCategory: categories[0] || 'General',
        avgItemsPerOrder: Math.round(avgItemsPerOrder * 100) / 100,
        preferredTime: hourStr,
      };
    });

    const topItemOrders = items.reduce((s, i) => s + 1, 0);

    return {
      topItemOrders,
      avgItemsPerOrder: items.length > 0
        ? items.reduce((s, i) => s + i.avgItemsPerOrder, 0) / items.length : 0,
      items,
    };
  }

  // ── RPT-C08: Walk-in vs Registered ────────────────────────────────

  async getWalkinVsRegistered(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .select("CASE WHEN inv.customerName IS NOT NULL AND inv.customerName != '' THEN 'registered' ELSE 'walk_in' END", 'segment')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalRevenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('segment')
      .getRawMany();

    const walkin = invoices.find((r: any) => r.segment === 'walk_in');
    const registered = invoices.find((r: any) => r.segment === 'registered');

    const items = [
      {
        segment: 'Walk-in',
        invoiceCount: Number(walkin?.invoiceCount || 0),
        totalRevenue: Number(walkin?.totalRevenue || 0),
        avgOrderValue: Number(walkin?.invoiceCount || 0) > 0
          ? Number(walkin?.totalRevenue || 0) / Number(walkin?.invoiceCount || 0) : 0,
      },
      {
        segment: 'Registered',
        invoiceCount: Number(registered?.invoiceCount || 0),
        totalRevenue: Number(registered?.totalRevenue || 0),
        avgOrderValue: Number(registered?.invoiceCount || 0) > 0
          ? Number(registered?.totalRevenue || 0) / Number(registered?.invoiceCount || 0) : 0,
      },
    ];

    return {
      fromDate: from,
      toDate: to,
      walkinRevenue: Number(walkin?.totalRevenue || 0),
      registeredRevenue: Number(registered?.totalRevenue || 0),
      items,
    };
  }

  // ── RPT-R01: Reservation Overview ──────────────────────────────────

  async getReservationOverview(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const reservations = await this.reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.table', 'table')
      .where('r.scheduledFor::date = :date', { date: targetDate })
      .orderBy('r.scheduledFor', 'ASC')
      .getMany();

    return {
      todayCount: reservations.length,
      confirmed: reservations.filter((r) => r.status === ReservationStatus.CONFIRMED).length,
      seated: reservations.filter((r) => r.status === ReservationStatus.SEATED).length,
      cancelled: reservations.filter((r) => r.status === ReservationStatus.CANCELLED).length,
      items: reservations.map((r) => ({
        id: r.id,
        guestName: r.customerName,
        scheduledFor: r.scheduledFor,
        partySize: r.partySize,
        status: r.status,
        source: r.source,
        tableLabel: r.table?.label || 'Not assigned',
      })),
    };
  }

  // ── RPT-R02: Table Utilization ─────────────────────────────────────

  async getTableUtilization(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const tables = await this.tableRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.zone', 'zone')
      .where('t.isActive = :active', { active: true })
      .getMany();

    const reservations = await this.reservationRepo.createQueryBuilder('r')
      .where('r.scheduledFor BETWEEN :from AND :to', { from, to })
      .andWhere('r.status IN (:...statuses)', { statuses: [ReservationStatus.CONFIRMED, ReservationStatus.SEATED, ReservationStatus.COMPLETED] })
      .getMany();

    // Compute real avg duration from reservation durationMinutes
    const avgDurationAll = reservations.length > 0
      ? reservations.reduce((s, r) => s + (r.durationMinutes || 90), 0) / reservations.length
      : 90;

    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.grandTotal', 'total')
      .addSelect('inv.tableIds', 'tableIds')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawMany();

    const diffDays = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
    const items = tables.map((t) => {
      const tableReservations = reservations.filter((r) => r.tableId === t.id);
      const utilizationRate = diffDays > 0
        ? Math.min(100, Math.round((tableReservations.length / diffDays) * 100)) : 0;
      const tableInvoices = invoices.filter((inv: any) => {
        const ids: string[] = inv.tableIds || [];
        return ids.includes(t.id);
      });
      const revenue = tableInvoices.reduce((s: number, inv: any) => s + Number(inv.total), 0);
      const tableAvgDuration = tableReservations.length > 0
        ? Math.round(tableReservations.reduce((s, r) => s + (r.durationMinutes || 90), 0) / tableReservations.length)
        : avgDurationAll;
      return {
        tableLabel: t.label,
        zoneName: t.zone?.name || 'Unassigned',
        capacity: t.capacity || 1,
        utilizationRate,
        revenue,
        avgDuration: tableAvgDuration,
      };
    });

    return {
      fromDate: from,
      toDate: to,
      avgUtilization: items.length > 0
        ? items.reduce((s, i) => s + i.utilizationRate, 0) / items.length : 0,
      revenuePerSeat: items.length > 0
        ? items.reduce((s, i) => s + i.revenue, 0) / items.reduce((s, i) => s + i.capacity, 0) : 0,
      items,
    };
  }

  // ── RPT-R03: Reservation Source ────────────────────────────────────

  async getReservationSource(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const sources = await this.reservationRepo.createQueryBuilder('r')
      .select('r.source', 'source')
      .addSelect('COUNT(r.id)', 'count')
      .addSelect('COALESCE(AVG(r.partySize), 0)', 'avgPartySize')
      .addSelect('COALESCE(SUM(CASE WHEN r.status = :noShow THEN 1 ELSE 0 END), 0)', 'noShowCount')
      .where('r.scheduledFor BETWEEN :from AND :to', { from, to })
      .setParameter('noShow', ReservationStatus.NO_SHOW)
      .groupBy('r.source')
      .getRawMany();

    const total = sources.reduce((s: number, r: any) => s + Number(r.count), 0);

    return {
      fromDate: from,
      toDate: to,
      onlineCount: Number(sources.find((r: any) => r.source === ReservationSource.ONLINE)?.count || 0),
      phoneCount: Number(sources.find((r: any) => r.source === ReservationSource.PHONE)?.count || 0),
      walkinCount: Number(sources.find((r: any) => r.source === ReservationSource.WALK_IN)?.count || 0),
      items: sources.map((r: any) => ({
        source: r.source,
        count: Number(r.count),
        percentage: total > 0 ? (Number(r.count) / total) * 100 : 0,
        avgPartySize: Number(r.avgPartySize),
        noShowRate: Number(r.count) > 0 ? (Number(r.noShowCount) / Number(r.count)) * 100 : 0,
      })),
    };
  }

  // ── RPT-R04: No-Show & Cancellation ───────────────────────────────

  async getReservationNoShow(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const reservations = await this.reservationRepo.createQueryBuilder('r')
      .select("TO_CHAR(r.scheduledFor, 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(CASE WHEN r.status = :noShow THEN 1 ELSE 0 END), 0)', 'noShows')
      .addSelect('COALESCE(SUM(CASE WHEN r.status = :cancelled THEN 1 ELSE 0 END), 0)', 'cancellations')
      .addSelect('COUNT(r.id)', 'total')
      .where('r.scheduledFor BETWEEN :from AND :to', { from, to })
      .setParameter('noShow', ReservationStatus.NO_SHOW)
      .setParameter('cancelled', ReservationStatus.CANCELLED)
      .groupBy("TO_CHAR(r.scheduledFor, 'YYYY-MM')")
      .orderBy('period', 'ASC')
      .getRawMany();

    const allReservations = reservations.reduce((s: number, r: any) => s + Number(r.total), 0);
    const allNoShows = reservations.reduce((s: number, r: any) => s + Number(r.noShows), 0);
    const allCancellations = reservations.reduce((s: number, r: any) => s + Number(r.cancellations), 0);
    const avgPartySize = await this.reservationRepo.average('partySize', {
      scheduledFor: Between(new Date(from), new Date(to + 'T23:59:59')),
    });

    return {
      fromDate: from,
      toDate: to,
      noShowRate: allReservations > 0 ? (allNoShows / allReservations) * 100 : 0,
      cancelRate: allReservations > 0 ? (allCancellations / allReservations) * 100 : 0,
      lostRevenue: allNoShows * (avgPartySize || 2) * 500,
      items: reservations.map((r: any) => ({
        period: r.period,
        noShows: Number(r.noShows),
        cancellations: Number(r.cancellations),
        noShowRate: Number(r.total) > 0 ? (Number(r.noShows) / Number(r.total)) * 100 : 0,
        cancelRate: Number(r.total) > 0 ? (Number(r.cancellations) / Number(r.total)) * 100 : 0,
      })),
    };
  }

  // ── RPT-R05: Peak Hours ───────────────────────────────────────────

  async getReservationPeakHours(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const hourly = await this.reservationRepo.createQueryBuilder('r')
      .select("EXTRACT(HOUR FROM r.scheduledFor)", 'hour')
      .addSelect("TO_CHAR(r.scheduledFor, 'Day')", 'dayOfWeek')
      .addSelect('COUNT(r.id)', 'reservationCount')
      .addSelect('COALESCE(AVG(r.partySize), 0)', 'avgPartySize')
      .where('r.scheduledFor BETWEEN :from AND :to', { from, to })
      .andWhere('r.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .groupBy('EXTRACT(HOUR FROM r.scheduledFor)')
      .addGroupBy("TO_CHAR(r.scheduledFor, 'Day')")
      .orderBy('reservationCount', 'DESC')
      .getRawMany();

    const maxCount = Math.max(...hourly.map((r: any) => Number(r.reservationCount)), 0);

    return {
      fromDate: from,
      toDate: to,
      peakDemand: maxCount,
      avgPartySize: hourly.length > 0
        ? hourly.reduce((s: number, r: any) => s + Number(r.avgPartySize), 0) / hourly.length : 0,
      items: hourly.map((r: any) => ({
        hour: `${Number(r.hour)}:00`,
        dayOfWeek: r.dayOfWeek?.trim() || '',
        reservationCount: Number(r.reservationCount),
        avgPartySize: Number(r.avgPartySize),
        demandScore: maxCount > 0 ? Math.round((Number(r.reservationCount) / maxCount) * 100) : 0,
      })),
    };
  }

  // ── RPT-R06: Zone Performance ─────────────────────────────────────

  async getZonePerformance(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const zones = await this.zoneRepo.find({ where: { isActive: true } });
    const tables = await this.tableRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.zone', 'zone')
      .where('t.isActive = :active', { active: true })
      .getMany();
    const reservations = await this.reservationRepo.createQueryBuilder('r')
      .where('r.scheduledFor BETWEEN :from AND :to', { from, to })
      .andWhere('r.status IN (:...statuses)', { statuses: [ReservationStatus.CONFIRMED, ReservationStatus.SEATED, ReservationStatus.COMPLETED] })
      .getMany();
    const invoices = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.grandTotal', 'total')
      .addSelect('inv.tableIds', 'tableIds')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawMany();

    const diffDays = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
    const items = zones.map((z) => {
      const zoneTables = tables.filter((t) => t.zoneId === z.id);
      const totalCapacity = zoneTables.reduce((s, t) => s + (t.capacity || 0), 0);
      const tableIds = zoneTables.map((t) => t.id);
      const zoneReservations = reservations.filter((r) => r.zoneId === z.id || (r.tableId && tableIds.includes(r.tableId)));
      const utilizationRate = diffDays > 0 && totalCapacity > 0
        ? Math.min(100, Math.round((zoneReservations.length / (diffDays * totalCapacity)) * 100)) : 0;
      const zoneInvoices = invoices.filter((inv: any) => {
        const ids: string[] = inv.tableIds || [];
        return ids.some((id) => tableIds.includes(id));
      });
      const revenue = zoneInvoices.reduce((s: number, inv: any) => s + Number(inv.total), 0);
      return {
        zoneName: z.name,
        tableCount: zoneTables.length,
        totalCapacity,
        utilizationRate,
        revenue,
        revenuePerSeat: totalCapacity > 0 && diffDays > 0 ? revenue / (totalCapacity * diffDays) : 0,
      };
    });

    return {
      fromDate: from,
      toDate: to,
      zoneCount: zones.length,
      avgUtilization: items.length > 0 ? items.reduce((s, i) => s + i.utilizationRate, 0) / items.length : 0,
      items,
    };
  }

  // ── RPT-P01: Purchase Order Summary ────────────────────────────────

  async getPoSummary(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const purchases = await this.purchaseRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .orderBy('p.purchaseDate', 'DESC')
      .getMany();

    return {
      fromDate: from,
      toDate: to,
      totalPos: purchases.length,
      totalValue: purchases.reduce((s, p) => s + Number(p.totalAmount), 0),
      outstanding: purchases.filter((p) => p.status === PurchaseStatus.ORDERED).length,
      items: purchases.map((p) => ({
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate,
        supplierName: p.supplier?.name || 'Unknown',
        status: p.status,
        totalAmount: Number(p.totalAmount),
      })),
    };
  }

  // ── RPT-P02: Supplier Performance ──────────────────────────────────

  async getSupplierPerformance(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const suppliers = await this.supplierRepo.find({ where: { isActive: true } });
    const purchases = await this.purchaseRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .getMany();

    const supplierMap: Record<string, { totalOrders: number; totalSpend: number; onTime: number; leadTimes: number[] }> = {};

    for (const p of purchases) {
      const sId = p.supplierId;
      if (!supplierMap[sId]) supplierMap[sId] = { totalOrders: 0, totalSpend: 0, onTime: 0, leadTimes: [] };
      supplierMap[sId].totalOrders++;
      supplierMap[sId].totalSpend += Number(p.totalAmount);
      if (p.status === PurchaseStatus.RECEIVED) supplierMap[sId].onTime++;
      const pDate = new Date(p.purchaseDate);
      const cDate = new Date(p.createdAt);
      const leadTime = Math.round((cDate.getTime() - pDate.getTime()) / 86400000);
      if (leadTime >= 0) supplierMap[sId].leadTimes.push(leadTime);
    }

    const items = suppliers.map((s) => {
      const data = supplierMap[s.id] || { totalOrders: 0, totalSpend: 0, onTime: 0, leadTimes: [] };
      return {
        supplierName: s.name,
        totalOrders: data.totalOrders,
        totalSpend: data.totalSpend,
        onTimeDelivery: data.totalOrders > 0 ? (data.onTime / data.totalOrders) * 100 : 0,
        avgLeadTime: data.leadTimes.length > 0
          ? Math.round(data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length) : 0,
      };
    });

    return {
      fromDate: from,
      toDate: to,
      activeSuppliers: suppliers.length,
      totalSpend: items.reduce((s, i) => s + i.totalSpend, 0),
      onTimeDelivery: items.length > 0
        ? items.reduce((s, i) => s + i.onTimeDelivery, 0) / items.length : 0,
      items,
    };
  }

  // ── RPT-P03: Purchase by Item ──────────────────────────────────────

  async getPurchaseByItem(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const items = await this.purchaseItemRepo.createQueryBuilder('pi')
      .innerJoin('pi.purchase', 'p')
      .leftJoin(Item, 'item', 'item.id = pi.itemId')
      .leftJoin(CategoryEntity, 'cat', 'cat.id = item.categoryId')
      .select('COALESCE(item.name, pi.itemId::text)', 'itemName')
      .addSelect('COALESCE(cat.name, \'Uncategorized\')', 'categoryName')
      .addSelect('COALESCE(SUM(pi.quantity), 0)', 'quantityPurchased')
      .addSelect('COALESCE(SUM(pi.totalPrice), 0)', 'totalCost')
      .addSelect('CASE WHEN SUM(pi.quantity) > 0 THEN SUM(pi.totalPrice) / SUM(pi.quantity) ELSE 0 END', 'avgUnitPrice')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status != :cancelled', { cancelled: PurchaseStatus.CANCELLED })
      .groupBy('item.name')
      .addGroupBy('cat.name')
      .addGroupBy('pi.itemId')
      .getRawMany();

    return {
      fromDate: from,
      toDate: to,
      totalItems: items.length,
      totalCost: items.reduce((s: number, r: any) => s + Number(r.totalCost), 0),
      items: items.map((r: any) => ({
        itemName: r.itemName || 'Unknown',
        categoryName: r.categoryName,
        quantityPurchased: Number(r.quantityPurchased),
        totalCost: Number(r.totalCost),
        avgUnitPrice: Number(r.avgUnitPrice),
      })),
    };
  }

  // ── RPT-P04: Price Comparison ──────────────────────────────────────

  async getPriceComparison(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const items = await this.purchaseItemRepo.createQueryBuilder('pi')
      .innerJoin('pi.purchase', 'p')
      .innerJoin('p.supplier', 'supplier')
      .leftJoin(Item, 'item', 'item.id = pi.itemId')
      .select('item.name', 'itemName')
      .addSelect('supplier.name', 'supplierName')
      .addSelect('AVG(pi.unitPrice)', 'avgPrice')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status != :cancelled', { cancelled: PurchaseStatus.CANCELLED })
      .groupBy('item.name')
      .addGroupBy('supplier.name')
      .getRawMany();

    const itemMap: Record<string, { itemName: string; prices: Record<string, number> }> = {};
    for (const r of items) {
      const name = r.itemName || 'Unknown';
      if (!itemMap[name]) itemMap[name] = { itemName: name, prices: {} };
      itemMap[name].prices[r.supplierName] = Number(r.avgPrice);
    }

    const results = Object.values(itemMap).map((item) => {
      const entries = Object.entries(item.prices).sort((a, b) => a[1] - b[1]);
      const best = entries[0];
      const worst = entries[entries.length - 1];
      const percentDiff = best && worst && best[1] > 0
        ? ((worst[1] - best[1]) / best[1]) * 100 : 0;
      return {
        itemName: item.itemName,
        supplierAPrice: entries[0]?.[1] || 0,
        supplierBPrice: entries[1]?.[1] || 0,
        bestValue: `${best?.[0]}: ₹${best?.[1].toFixed(2)}` || 'N/A',
        percentDifference: Math.round(percentDiff * 100) / 100,
        supplierCount: entries.length,
      };
    });

    const potentialSavings = results.reduce((s, i) => s + (i.supplierBPrice - i.supplierAPrice), 0);

    return {
      fromDate: from,
      toDate: to,
      totalItems: results.length,
      potentialSavings: Math.max(0, potentialSavings),
      items: results,
    };
  }

  // ── RPT-P05: Purchase-to-Pay ───────────────────────────────────────

  async getPurchaseToPay(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const purchases = await this.purchaseRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .orderBy('p.purchaseDate', 'DESC')
      .getMany();

    const items = purchases.map((p) => {
      const orderDate = new Date(p.purchaseDate);
      const receivedDate = p.status === PurchaseStatus.RECEIVED ? new Date(p.createdAt) : null;
      const daysToReceive = receivedDate
        ? Math.round((receivedDate.getTime() - orderDate.getTime()) / 86400000) : null;
      return {
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplier?.name || 'Unknown',
        orderDate: p.purchaseDate,
        status: p.status,
        receivedDate: receivedDate?.toISOString().split('T')[0] || null,
        daysToReceive: daysToReceive ?? null,
      };
    });

    const receivedItems = items.filter((i) => i.daysToReceive !== null);

    return {
      fromDate: from,
      toDate: to,
      avgDaysToReceive: receivedItems.length > 0
        ? Math.round((receivedItems.reduce((s, i) => s + (i.daysToReceive || 0), 0) / receivedItems.length) * 10) / 10 : 0,
      pendingCount: purchases.filter((p) => p.status === PurchaseStatus.ORDERED || p.status === PurchaseStatus.DRAFT).length,
      items,
    };
  }

  // ── RPT-P06: Reorder Report ────────────────────────────────────────

  async getReorderReport() {
    const stock = await this.inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'cat')
      .getMany();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const consumption = await this.movementRepo.createQueryBuilder('sm')
      .select('sm.itemId', 'itemId')
      .addSelect('COALESCE(SUM(sm.quantity), 0)', 'totalConsumed')
      .where('sm.type IN (:...types)', { types: [MovementType.PRODUCTION_CONSUMPTION, MovementType.SALE_OUT] })
      .andWhere('sm.createdAt >= :since', { since: thirtyDaysAgo })
      .groupBy('sm.itemId')
      .getRawMany();
    const consumptionMap = new Map(consumption.map((r: any) => [r.itemId, Number(r.totalConsumed)]));

    // Find preferred supplier per item from purchase history
    const supplierPrefs = await this.purchaseItemRepo.createQueryBuilder('pi')
      .innerJoin('pi.purchase', 'p')
      .innerJoin('p.supplier', 'supplier')
      .select('pi.itemId', 'itemId')
      .addSelect("MODE() WITHIN GROUP (ORDER BY supplier.name)", 'topSupplier')
      .groupBy('pi.itemId')
      .getRawMany();
    const supplierMap = new Map(supplierPrefs.map((r: any) => [r.itemId, r.topSupplier]));

    const items = stock
      .filter((s) => Number(s.currentStock) <= Number(s.minStockLevel))
      .map((s) => {
        const avgDaily = Math.max(0.01, (consumptionMap.get(s.itemId) || 0) / 30);
        const daysUntilStockout = Math.floor(Number(s.currentStock) / avgDaily);
        return {
          itemName: s.item?.name || 'Unknown',
          currentStock: Number(s.currentStock),
          reorderPoint: Number(s.minStockLevel),
          daysUntilStockout,
          suggestedQty: Math.ceil(Number(s.minStockLevel) * 2 - Number(s.currentStock)),
          preferredSupplier: supplierMap.get(s.itemId) || 'Default',
        };
      })
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return {
      itemsToReorder: items.length,
      urgentItems: items.filter((i) => i.daysUntilStockout <= 3).length,
      items,
    };
  }

  // ── RPT-P07: Monthly Purchase Trend ────────────────────────────────

  async getMonthlyPurchaseTrend(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const purchases = await this.purchaseRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .select("TO_CHAR(p.purchaseDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(p.id)', 'poCount')
      .addSelect('COALESCE(SUM(p.totalAmount), 0)', 'totalValue')
      .addSelect("MODE() WITHIN GROUP (ORDER BY supplier.name)", 'topSupplier')
      .where('p.purchaseDate BETWEEN :from AND :to', { from, to })
      .andWhere('p.status != :cancelled', { cancelled: PurchaseStatus.CANCELLED })
      .groupBy("TO_CHAR(p.purchaseDate, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const items = purchases.map((r: any, idx: number) => {
      const prevValue = idx > 0 ? Number(purchases[idx - 1]?.totalValue || 0) : 0;
      const momChange = prevValue > 0 ? ((Number(r.totalValue) - prevValue) / prevValue) * 100 : null;
      return {
        month: r.month,
        poCount: Number(r.poCount),
        totalValue: Number(r.totalValue),
        momChange: momChange !== null ? Math.round(momChange * 100) / 100 : null,
        topSupplier: r.topSupplier || 'N/A',
      };
    });

    return {
      fromDate: from,
      toDate: to,
      monthTotal: items.length > 0 ? items[items.length - 1]?.totalValue || 0 : 0,
      momChange: items.length > 1 ? items[items.length - 1]?.momChange || 0 : null,
      items,
    };
  }

  // ── RPT-O01: Daily Operations Summary ──────────────────────────────

  async getDailySummary(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sales = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'orderCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'todayRevenue')
      .where('inv.invoiceDate = :date', { date: targetDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const tablesOccupied = await this.tableRepo.count({ where: { status: 'occupied' } });
    const allInv = await this.inventoryRepo.find();
    const lowStockItems = allInv.filter((i) => Number(i.currentStock) <= Number(i.minStockLevel)).length;

    return {
      date: targetDate,
      todayRevenue: Number(sales?.todayRevenue || 0),
      orderCount: Number(sales?.orderCount || 0),
      tablesOccupied,
      lowStockItems,
    };
  }

  // ── RPT-O02: Staff Activity ────────────────────────────────────────

  async getStaffActivity(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const users = await this.userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.isActive = :active', { active: true })
      .getMany();

    const kotStats = await this.kotRepo.createQueryBuilder('kot')
      .select('kot.preparedBy', 'userId')
      .addSelect('COUNT(kot.id)', 'ordersHandled')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('kot.preparedBy IS NOT NULL')
      .groupBy('kot.preparedBy')
      .getRawMany();

    const kotMap = new Map(kotStats.map((r: any) => [r.userId, Number(r.ordersHandled)]));

    const items = users.map((u) => ({
      staffName: u.name,
      role: u.role?.name || 'Staff',
      actionCount: kotMap.get(u.id) || 0,
      ordersHandled: kotMap.get(u.id) || 0,
      lastActive: u.updatedAt?.toISOString() || null,
    }));

    return {
      fromDate: from,
      toDate: to,
      activeStaff: users.length,
      totalActions: items.reduce((s, i) => s + i.actionCount, 0),
      items,
    };
  }

  // ── RPT-O03: Hourly Operations ─────────────────────────────────────

  async getHourlyOperations(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const hourlySales = await this.invoiceRepo.createQueryBuilder('inv')
      .select("EXTRACT(HOUR FROM inv.createdAt)", 'hour')
      .addSelect('COUNT(inv.id)', 'orders')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'sales')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy("EXTRACT(HOUR FROM inv.createdAt)")
      .getRawMany();

    const hourlyKots = await this.kotRepo.createQueryBuilder('kot')
      .select("EXTRACT(HOUR FROM kot.createdAt)", 'hour')
      .addSelect('COUNT(kot.id)', 'kots')
      .where('kot.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy("EXTRACT(HOUR FROM kot.createdAt)")
      .getRawMany();

    const salesMap = new Map(hourlySales.map((r: any) => [Number(r.hour), r]));
    const kotMap = new Map(hourlyKots.map((r: any) => [Number(r.hour), Number(r.kots)]));

    const totalOccupied = await this.tableRepo.count({ where: { status: 'occupied' } });

    const hours = Array.from({ length: 18 }, (_, i) => i + 6);
    const items = hours.map((h) => ({
      hour: `${h}:00`,
      sales: Number(salesMap.get(h)?.sales || 0),
      orders: Number(salesMap.get(h)?.orders || 0),
      kots: kotMap.get(h) || 0,
      tablesActive: totalOccupied,
    }));

    const peakHour = items.reduce((max, i) => i.sales > max.sales ? i : max, items[0]);

    return {
      fromDate: from,
      toDate: to,
      peakHourSales: peakHour?.sales || 0,
      peakHourOrders: peakHour?.orders || 0,
      items,
    };
  }

  // ── RPT-O04: Weekly Review ─────────────────────────────────────────

  async getWeeklyReview(date?: string) {
    const target = new Date(date || new Date().toISOString().split('T')[0]);
    const dayOfWeek = target.getDay();
    const weekStart = new Date(target.getTime() - dayOfWeek * 86400000).toISOString().split('T')[0];
    const weekEnd = new Date(target.getTime() + (6 - dayOfWeek) * 86400000).toISOString().split('T')[0];
    const prevWeekStart = new Date(target.getTime() - dayOfWeek * 86400000 - 7 * 86400000).toISOString().split('T')[0];
    const prevWeekEnd = new Date(target.getTime() - dayOfWeek * 86400000 - 1 * 86400000).toISOString().split('T')[0];

    const daily = await this.invoiceRepo.createQueryBuilder('inv')
      .select("TO_CHAR(inv.invoiceDate, 'Day')", 'day')
      .addSelect('inv.invoiceDate', 'date')
      .addSelect('COUNT(inv.id)', 'orders')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: weekStart, to: weekEnd })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.invoiceDate')
      .orderBy('inv.invoiceDate', 'ASC')
      .getRawMany();

    // Previous week revenue for WoW comparison
    const prevWeekRev = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: prevWeekStart, to: prevWeekEnd })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    // Reservations and no-shows for the week
    const reservationStats = await this.reservationRepo.createQueryBuilder('r')
      .select("TO_CHAR(r.scheduledFor, 'Day')", 'day')
      .addSelect("COUNT(CASE WHEN r.status != 'cancelled' AND r.status != 'no_show' THEN 1 END)", 'reservations')
      .addSelect("COUNT(CASE WHEN r.status = 'no_show' THEN 1 END)", 'noShows')
      .where('r.scheduledFor BETWEEN :from AND :to', { from: weekStart, to: weekEnd })
      .groupBy("TO_CHAR(r.scheduledFor, 'Day')")
      .getRawMany();
    const resMap = new Map(reservationStats.map((r: any) => [r.day?.trim(), { reservations: Number(r.reservations), noShows: Number(r.noShows) }]));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = new Map(daily.map((r: any) => [r.day?.trim(), { revenue: Number(r.revenue), orders: Number(r.orders), date: r.date }]));

    const items = dayNames.map((day) => {
      const data = dayMap.get(day) || { revenue: 0, orders: 0, date: null };
      const res = resMap.get(day) || { reservations: 0, noShows: 0 };
      return {
        day,
        revenue: data.revenue,
        orders: data.orders,
        avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
        reservations: res.reservations,
        noShows: res.noShows,
      };
    });

    const weeklyRevenue = items.reduce((s, i) => s + i.revenue, 0);
    const prevRevenue = Number(prevWeekRev?.revenue || 0);
    const bestDay = items.reduce((max, i) => i.revenue > max.revenue ? i : max, items[0]);

    return {
      weekStart,
      weekEnd,
      weeklyRevenue,
      bestDay: bestDay.day,
      wowChange: prevRevenue > 0 ? Math.round(((weeklyRevenue - prevRevenue) / prevRevenue) * 10000) / 100 : null,
      items,
    };
  }

  // ── RPT-O05: Peak Staffing ─────────────────────────────────────────

  async getPeakStaffing(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const hourlySales = await this.invoiceRepo.createQueryBuilder('inv')
      .select("EXTRACT(HOUR FROM inv.createdAt)", 'hour')
      .addSelect('COUNT(inv.id)', 'ordersPerHour')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy("EXTRACT(HOUR FROM inv.createdAt)")
      .getRawMany();

    const hours = Array.from({ length: 18 }, (_, i) => i + 6);
    const salesMap = new Map(hourlySales.map((r: any) => [Number(r.hour), r]));

    const activeStaffCount = await this.userRepo.count({ where: { isActive: true } });

    const items = hours.map((h) => {
      const data = salesMap.get(h);
      const ordersPerHour = Number(data?.ordersPerHour || 0);
      const staffNeeded = Math.max(1, Math.ceil(ordersPerHour / 5));
      const currentStaff = activeStaffCount;
      return {
        hour: `${h}:00`,
        revenue: Number(data?.revenue || 0),
        ordersPerHour,
        staffNeeded,
        currentStaff,
        gap: Math.max(0, staffNeeded - currentStaff),
      };
    });

    const peakStaffNeeded = Math.max(...items.map((i) => i.staffNeeded), 0);
    const staffingGap = Math.max(...items.map((i) => i.gap), 0);

    return {
      fromDate: from,
      toDate: to,
      peakStaffNeeded,
      staffingGap,
      items,
    };
  }

  // ── RPT-O06: Payment Collection ────────────────────────────────────

  async getPaymentCollection(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const payments = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.paymentMethod', 'method')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalCollected')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.paymentMethod')
      .getRawMany();

    const grandTotal = payments.reduce((s: number, r: any) => s + Number(r.totalCollected), 0);
    const cash = payments.find((r: any) => r.method === 'cash');
    const cardUpi = payments.filter((r: any) => r.method !== 'cash');

    // Outstanding credit: total of credit-method invoices (credit is inherently outstanding)
    const creditOutstanding = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'total')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.paymentMethod = :method', { method: 'credit' })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    return {
      fromDate: from,
      toDate: to,
      cashCollected: Number(cash?.totalCollected || 0),
      cardUpiCollected: cardUpi.reduce((s: number, r: any) => s + Number(r.totalCollected), 0),
      creditOutstanding: Number(creditOutstanding?.total || 0),
      items: payments.map((r: any) => ({
        method: r.method || 'Unknown',
        invoiceCount: Number(r.invoiceCount),
        totalCollected: Number(r.totalCollected),
        percentage: grandTotal > 0 ? (Number(r.totalCollected) / grandTotal) * 100 : 0,
        avgTransaction: Number(r.invoiceCount) > 0
          ? Number(r.totalCollected) / Number(r.invoiceCount) : 0,
      })),
    };
  }

  // ── RPT-O07: Cancellation Summary ──────────────────────────────────

  async getCancellationSummary(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const cancelledInvoices = await this.invoiceRepo.count({
      where: {
        invoiceDate: Between(new Date(from), new Date(to + 'T23:59:59')),
        status: InvoiceStatus.CANCELLED,
      },
    });
    const totalInvoices = await this.invoiceRepo.count({
      where: {
        invoiceDate: Between(new Date(from), new Date(to + 'T23:59:59')),
      },
    });

    const cancelledKots = await this.kotRepo.count({
      where: {
        createdAt: Between(new Date(from), new Date(to + 'T23:59:59')),
        status: KotStatus.CANCELLED,
      },
    });
    const totalKots = await this.kotRepo.count({
      where: {
        createdAt: Between(new Date(from), new Date(to + 'T23:59:59')),
      },
    });

    const cancelledReservations = await this.reservationRepo.count({
      where: {
        scheduledFor: Between(new Date(from), new Date(to + 'T23:59:59')),
        status: ReservationStatus.CANCELLED,
      },
    });
    const totalReservations = await this.reservationRepo.count({
      where: {
        scheduledFor: Between(new Date(from), new Date(to + 'T23:59:59')),
      },
    });

    const revenueImpact = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'lost')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status = :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const items = [
      {
        category: 'Invoices',
        totalCreated: totalInvoices,
        cancelled: cancelledInvoices,
        cancelRate: totalInvoices > 0 ? (cancelledInvoices / totalInvoices) * 100 : 0,
      },
      {
        category: 'KOTs',
        totalCreated: totalKots,
        cancelled: cancelledKots,
        cancelRate: totalKots > 0 ? (cancelledKots / totalKots) * 100 : 0,
      },
      {
        category: 'Reservations',
        totalCreated: totalReservations,
        cancelled: cancelledReservations,
        cancelRate: totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0,
      },
    ];

    return {
      fromDate: from,
      toDate: to,
      totalCancelled: cancelledInvoices + cancelledKots + cancelledReservations,
      revenueImpact: Number(revenueImpact?.lost || 0),
      cancelRate: (totalInvoices + totalKots + totalReservations) > 0
        ? ((cancelledInvoices + cancelledKots + cancelledReservations) / (totalInvoices + totalKots + totalReservations)) * 100 : 0,
      items,
    };
  }

  // ── RPT-O08: EOD Reconciliation ────────────────────────────────────

  async getEodReconciliation(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sales = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'totalInvoices')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(CASE WHEN inv.status = :cancelled THEN 1 ELSE 0 END), 0)', 'cancelledInvoices')
      .addSelect('COALESCE(SUM(CASE WHEN inv.status = :cancelled THEN inv.grandTotal ELSE 0 END), 0)', 'cancelledValue')
      .where('inv.invoiceDate = :date', { date: targetDate })
      .setParameter('cancelled', InvoiceStatus.CANCELLED)
      .getRawOne();

    const wastage = await this.movementRepo.createQueryBuilder('sm')
      .select('COALESCE(SUM(sm.quantity * inv.unitCost), 0)', 'wastageValue')
      .leftJoin(Inventory, 'inv', 'inv.itemId = sm.itemId')
      .where('sm.type = :type', { type: MovementType.WASTAGE })
      .andWhere('sm.createdAt::date = :date', { date: targetDate })
      .getRawOne();

    const reservations = await this.reservationRepo.count({
      where: { scheduledFor: Between(new Date(targetDate), new Date(targetDate + 'T23:59:59')) },
    });

    return {
      date: targetDate,
      totalRevenue: Number(sales?.totalRevenue || 0),
      totalInvoices: Number(sales?.totalInvoices || 0),
      cancelledInvoices: Number(sales?.cancelledInvoices || 0),
      cancelledValue: Number(sales?.cancelledValue || 0),
      wastageValue: Number(wastage?.wastageValue || 0),
      reservations,
    };
  }

  // ── RPT-E01: Executive KPI Dashboard ───────────────────────────────

  async getKpiDashboard() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const prevThirtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];

    const sales = await this.getSalesReport(thirtyDaysAgo, today);
    const prevSales = await this.getSalesReport(prevThirtyDaysAgo, thirtyDaysAgo);
    const pl = await this.getProfitLoss(thirtyDaysAgo, today);

    const repeatInvoices = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('COUNT(inv.id)', 'cnt')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: thirtyDaysAgo, to: today })
      .andWhere('inv.customerPhone IS NOT NULL')
      .groupBy('inv.customerPhone')
      .having('COUNT(inv.id) > 1')
      .getRawMany();

    const totalCustomers = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COUNT(DISTINCT inv.customerPhone)', 'total')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: thirtyDaysAgo, to: today })
      .andWhere('inv.customerPhone IS NOT NULL')
      .getRawOne();

    const totalUnique = Number(totalCustomers?.total || 0);
    const tableTurnover = await this.tableRepo.count({ where: { isActive: true } });

    // Real wastage % from stock movements
    const wastage = await this.movementRepo.createQueryBuilder('sm')
      .select('COALESCE(SUM(sm.quantity * inv.unitCost), 0)', 'wastageValue')
      .leftJoin(Inventory, 'inv', 'inv.itemId = sm.itemId')
      .where('sm.type = :type', { type: MovementType.WASTAGE })
      .andWhere('sm.createdAt >= :since', { since: thirtyDaysAgo })
      .getRawOne();
    const wasteValue = Number(wastage?.wastageValue || 0);
    const wastePercent = sales.totalSales > 0 ? (wasteValue / sales.totalSales) * 100 : 0;

    return {
      totalRevenue: sales.totalSales,
      grossMargin: pl.grossMargin,
      netProfit: pl.netProfit,
      repeatRate: totalUnique > 0 ? (repeatInvoices.length / totalUnique) * 100 : 0,
      tableTurnover: tableTurnover > 0 ? sales.invoiceCount / tableTurnover : 0,
      wastePercent,
      vsLastPeriod: prevSales.totalSales > 0
        ? ((sales.totalSales - prevSales.totalSales) / prevSales.totalSales) * 100 : 0,
    };
  }

  // ── RPT-E02: Profitability Analysis ────────────────────────────────

  async getProfitability(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const itemProfit = await this.invoiceItemRepo.createQueryBuilder('ii')
      .innerJoin('ii.invoice', 'inv')
      .innerJoin(Item, 'item', 'item.id = ii.itemId')
      .select('item.name', 'dimension')
      .addSelect('COALESCE(SUM(ii.totalAmount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(ii.quantity * item.costPrice), 0)', 'cost')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('item.name')
      .getRawMany();

    const items = itemProfit.map((r: any) => {
      const revenue = Number(r.revenue);
      const cost = Number(r.cost);
      const profit = revenue - cost;
      return {
        dimension: r.dimension || 'Unknown',
        revenue,
        cost,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      };
    });

    return {
      fromDate: from,
      toDate: to,
      grossProfit: items.reduce((s, i) => s + i.profit, 0),
      avgMargin: items.length > 0 ? items.reduce((s, i) => s + i.margin, 0) / items.length : 0,
      items,
    };
  }

  // ── RPT-E03: Health Scorecard ──────────────────────────────────────

  async getHealthScorecard() {
    const now = new Date();
    const thirty = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const pl = await this.getProfitLoss(thirty, today);
    const inventory = await this.getStockStatus();

    const financialScore = pl.netMargin > 20 ? 90 : pl.netMargin > 10 ? 70 : pl.netMargin > 0 ? 50 : 30;
    const operationalScore = inventory.summary.lowStockCount === 0 ? 90 : inventory.summary.lowStockCount < 5 ? 70 : 50;

    // Customer score based on repeat rate
    const repeatData = await this.invoiceRepo.createQueryBuilder('inv')
      .select('inv.customerPhone', 'phone')
      .addSelect('COUNT(inv.id)', 'cnt')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: thirty, to: today })
      .andWhere('inv.customerPhone IS NOT NULL')
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy('inv.customerPhone')
      .getRawMany();
    const totalCustomers = repeatData.length;
    const repeatCustomers = repeatData.filter((r: any) => Number(r.cnt) > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    const customerScore = repeatRate > 40 ? 90 : repeatRate > 20 ? 70 : repeatRate > 10 ? 50 : 30;

    // Compliance score based on whether GST has been filed in the period
    const gstFiled = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.taxTotal), 0)', 'tax')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: thirty, to: today })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();
    const hasGstActivity = Number(gstFiled?.tax || 0) > 0;
    const complianceScore = hasGstActivity ? 85 : 50;

    const overallScore = Math.round((financialScore + operationalScore + customerScore + complianceScore) / 4);

    return {
      overallScore,
      financialScore,
      operationalScore,
      customerScore,
      complianceScore,
      items: [
        { category: 'Financial Health', score: financialScore, weight: 0.3, status: financialScore >= 70 ? 'Good' : financialScore >= 50 ? 'Fair' : 'Poor' },
        { category: 'Operational Efficiency', score: operationalScore, weight: 0.25, status: operationalScore >= 70 ? 'Good' : 'Fair' },
        { category: 'Customer Satisfaction', score: customerScore, weight: 0.25, status: customerScore >= 70 ? 'Good' : customerScore >= 50 ? 'Fair' : 'Poor' },
        { category: 'Compliance & Tax', score: complianceScore, weight: 0.2, status: complianceScore >= 70 ? 'Good' : 'Fair' },
      ],
    };
  }

  // ── RPT-E04: Trend & Forecast ──────────────────────────────────────

  async getTrendForecast() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const trends = await this.invoiceRepo.createQueryBuilder('inv')
      .select("TO_CHAR(inv.invoiceDate, 'YYYY-MM')", 'period')
      .addSelect('COUNT(inv.id)', 'orders')
      .addSelect('COALESCE(SUM(inv.subtotal), 0)', 'subtotal')
      .addSelect('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: twelveMonthsAgo, to: today })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .groupBy("TO_CHAR(inv.invoiceDate, 'YYYY-MM')")
      .orderBy('period', 'ASC')
      .getRawMany();

    const items = trends.map((r: any, idx: number) => {
      const revenue = Number(r.revenue);
      const subtotal = Number(r.subtotal);
      const foodCostPercent = revenue > 0 ? ((revenue - subtotal) / revenue) * 100 : 0;
      const avgOrderValue = Number(r.orders) > 0 ? revenue / Number(r.orders) : 0;
      return {
        period: r.period,
        revenue,
        orders: Number(r.orders),
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        foodCostPercent: Math.round(foodCostPercent * 100) / 100,
        type: 'actual',
      };
    });

    const last3 = items.slice(-3);
    const avgRevenue = last3.length > 0 ? last3.reduce((s, i) => s + i.revenue, 0) / last3.length : 0;
    const revenueGrowth = items.length >= 2
      ? ((items[items.length - 1].revenue - items[0].revenue) / items[0].revenue) * 100 : 0;

    const lastPeriod = items[items.length - 1] || { revenue: 0, orders: 0, foodCostPercent: 35, avgOrderValue: 0 };
    const forecastMonths = ['actual', 'actual', 'actual', 'forecast', 'forecast', 'forecast'];
    const forecastItems = forecastMonths.map((type, idx) => {
      const monthOffset = idx - (forecastMonths.length - 4);
      const period = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const periodStr = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
      const existing = items.find((i) => i.period === periodStr);
      if (existing) return existing;
      const lastOrders = lastPeriod.orders || 1;
      const projectedRevenue = Math.round(avgRevenue * (1 + (monthOffset > 0 ? 0.03 * monthOffset : 0)));
      const projectedOrders = Math.round(lastOrders * (1 + 0.02));
      return {
        period: periodStr,
        revenue: projectedRevenue,
        orders: projectedOrders,
        avgOrderValue: Math.round((projectedRevenue / Math.max(1, projectedOrders)) * 100) / 100,
        foodCostPercent: lastPeriod.foodCostPercent || 35,
        type,
      };
    });

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      forecastNextMonth: forecastItems.find((i) => i.type === 'forecast')?.revenue || 0,
      items: forecastItems,
    };
  }

  // ── RPT-E05: Comparative Analysis ──────────────────────────────────

  async getComparativeAnalysis(fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);
    const daysDiff = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
    const prevTo = from;
    const prevFrom = new Date(new Date(from).getTime() - daysDiff * 86400000).toISOString().split('T')[0];

    const current = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .addSelect('COUNT(inv.id)', 'count')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from, to })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const previous = await this.invoiceRepo.createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.grandTotal), 0)', 'revenue')
      .addSelect('COUNT(inv.id)', 'count')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: prevFrom, to: prevTo })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const currentRevenue = Number(current?.revenue || 0);
    const previousRevenue = Number(previous?.revenue || 0);
    const change = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const items = [
      {
        dimension: 'Total Revenue',
        current: currentRevenue,
        previous: previousRevenue,
        change: Math.round(change * 100) / 100,
        direction: change >= 0 ? 'up' : 'down',
      },
      {
        dimension: 'Order Count',
        current: Number(current?.count || 0),
        previous: Number(previous?.count || 0),
        change: Number(previous?.count || 0) > 0
          ? Math.round(((Number(current?.count || 0) - Number(previous?.count || 0)) / Number(previous?.count || 0)) * 10000) / 100 : 0,
        direction: Number(current?.count || 0) >= Number(previous?.count || 0) ? 'up' : 'down',
      },
      {
        dimension: 'Avg Order Value',
        current: Number(current?.count || 0) > 0 ? currentRevenue / Number(current?.count || 0) : 0,
        previous: Number(previous?.count || 0) > 0 ? previousRevenue / Number(previous?.count || 0) : 0,
        change: Number(previous?.count || 0) > 0 && Number(current?.count || 0) > 0 && previousRevenue > 0
          ? Math.round(((currentRevenue / Number(current.count) - previousRevenue / Number(previous.count)) / (previousRevenue / Number(previous.count))) * 10000) / 100 : 0,
        direction: Number(current?.count || 0) > 0 && Number(previous?.count || 0) > 0
          ? (currentRevenue / Number(current.count)) >= (previousRevenue / Number(previous.count)) ? 'up' : 'down' : 'up',
      },
    ];

    return {
      fromDate: from,
      toDate: to,
      periodRevenue: currentRevenue,
      periodChange: Math.round(change * 100) / 100,
      items,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
}
