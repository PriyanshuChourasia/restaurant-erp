import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../entities/sales.entity';
import { PriceLevelsService } from '../../price-levels/services/price-levels.service';
import { TablesService } from '../../seating/services/tables.service';
import { CustomersService } from '../../customers/services/customers.service';
import { RecipesService } from '../../recipes/services/recipes.service';
import { Item } from '../../items/entities/item.entity';
import { Inventory, StockMovement, MovementType } from '../../inventory/entities/inventory.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
    private readonly priceLevelsService: PriceLevelsService,
    private readonly tablesService: TablesService,
    private readonly customersService: CustomersService,
    private readonly recipesService: RecipesService,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
  ) {}

  async findAll(page = 1, limit = 20, status?: string, search?: string, fromDate?: string, toDate?: string) {
    const query = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items');

    if (status) query.andWhere('inv.status = :status', { status });
    if (search) query.andWhere('(inv.invoiceNumber ILIKE :search OR inv.customerName ILIKE :search)', { search: `%${search}%` });
    if (fromDate) query.andWhere('inv.invoiceDate >= :fromDate', { fromDate });
    if (toDate) query.andWhere('inv.invoiceDate <= :toDate', { toDate });

    query.orderBy('inv.createdAt', 'DESC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const invoice = await this.repo.findOne({ where: { id }, relations: { items: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string;
    tableIds?: string[];
    paymentMethod?: PaymentMethod;
    discount?: number;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
    }>;
  }) {
    // Resolve price level
    let resolvedPriceLevelId: string | null = null;
    let effectiveCustomerName = dto.customerName || null;
    let effectiveCustomerPhone = dto.customerPhone || null;
    let effectiveCustomerGstin = dto.customerGstin || null;

    if (dto.customerId) {
      const customer = await this.customersService.findOne(dto.customerId);
      resolvedPriceLevelId = customer.priceLevelId;
      // Auto-fill customer info from record if not explicitly provided
      effectiveCustomerName = effectiveCustomerName || customer.name;
      effectiveCustomerPhone = effectiveCustomerPhone || customer.phone;
      effectiveCustomerGstin = effectiveCustomerGstin || customer.gstin;
    }

    // If no price level from customer, get the default
    if (!resolvedPriceLevelId) {
      const activeLevels = await this.priceLevelsService.findAllActive();
      const defaultLevel = activeLevels.find((pl) => pl.isDefault);
      resolvedPriceLevelId = defaultLevel?.id ?? null;
    }

    // Resolve prices server-side
    const itemEntities: Array<{
      itemId: string;
      itemName: string;
      hsnCode: string;
      quantity: number;
      unitPrice: number;
      gstRate: number;
      taxableValue: number;
      cgstAmount: number;
      sgstAmount: number;
      totalAmount: number;
    }> = [];

    for (const cartItem of dto.items) {
      // Get item base info
      const item = await this.itemRepo.findOne({ where: { id: cartItem.itemId } });
      if (!item) {
        throw new NotFoundException(`Item with ID "${cartItem.itemId}" not found`);
      }

      // Get effective price for this item at the resolved price level
      let unitPrice = item.price;
      if (resolvedPriceLevelId) {
        try {
          unitPrice = await this.priceLevelsService.getEffectivePrice(cartItem.itemId, resolvedPriceLevelId);
        } catch {
          // Fallback to base price if price level resolution fails
          unitPrice = item.price;
        }
      }

      const taxableValue = cartItem.quantity * unitPrice;
      const gstRateHalf = item.gstRate / 2;
      const cgstAmount = (taxableValue * gstRateHalf) / 100;
      const sgstAmount = (taxableValue * gstRateHalf) / 100;
      const totalAmount = taxableValue + cgstAmount + sgstAmount;

      itemEntities.push({
        itemId: item.id,
        itemName: item.name,
        hsnCode: item.hsnCode,
        quantity: cartItem.quantity,
        unitPrice,
        gstRate: item.gstRate,
        taxableValue,
        cgstAmount,
        sgstAmount,
        totalAmount,
      });
    }

    const subtotal = itemEntities.reduce((s, i) => s + i.taxableValue, 0);
    const cgstTotal = itemEntities.reduce((s, i) => s + i.cgstAmount, 0);
    const sgstTotal = itemEntities.reduce((s, i) => s + i.sgstAmount, 0);
    const taxTotal = cgstTotal + sgstTotal;
    const discount = dto.discount || 0;
    const rawTotal = subtotal + taxTotal - discount;
    const grandTotal = Math.round(rawTotal * 100) / 100;
    const finalTotal = Math.round(grandTotal);
    const roundOff = Math.round((finalTotal - grandTotal) * 100) / 100;

    const count = await this.repo.count();
    const invoice = this.repo.create({
      invoiceNumber: `INV-${String(count + 1).padStart(6, '0')}`,
      customerId: dto.customerId || null,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      customerGstin: effectiveCustomerGstin,
      tableIds: dto.tableIds && dto.tableIds.length > 0 ? dto.tableIds : null,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      invoiceDate: new Date(),
      status: InvoiceStatus.CONFIRMED,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      taxTotal,
      discount,
      roundOff,
      grandTotal: finalTotal,
      notes: dto.notes || null,
      items: itemEntities as InvoiceItem[],
    });
    const saved = await this.repo.save(invoice);

    // Occupy selected tables
    if (dto.tableIds && dto.tableIds.length > 0) {
      await this.tablesService.bulkUpdateStatus(dto.tableIds, 'occupied');
    }

    // Recipe-based stock deduction: for each sold item, check if it has a recipe
    // If so, deduct component stock via recipe; otherwise, do direct inventory deduction
    for (const cartItem of dto.items) {
      const recipeDeducted = await this.recipesService.deductOnSale(
        cartItem.itemId,
        cartItem.quantity,
        saved.invoiceNumber,
      );

      if (!recipeDeducted) {
        // No recipe — direct deduction from the item's own inventory
        const inv = await this.inventoryRepo.findOne({ where: { itemId: cartItem.itemId } });
        if (inv) {
          const balanceBefore = inv.currentStock;
          const balanceAfter = balanceBefore - cartItem.quantity;
          inv.currentStock = Math.max(0, balanceAfter);
          await this.inventoryRepo.save(inv);

          await this.movementRepo.save(this.movementRepo.create({
            itemId: cartItem.itemId,
            type: MovementType.SALE_OUT,
            quantity: cartItem.quantity,
            balanceBefore,
            balanceAfter: inv.currentStock,
            reference: saved.invoiceNumber,
            notes: `Sale: ${cartItem.quantity}x item`,
          }));
        }
      }
    }

    return saved;
  }

  async clearTables(invoiceId: string) {
    const invoice = await this.findById(invoiceId);
    if (invoice.tableIds && invoice.tableIds.length > 0) {
      await this.tablesService.bulkUpdateStatus(invoice.tableIds, 'available');
    }
    return { message: 'Tables cleared' };
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    await this.findById(id);
    await this.repo.update(id, { status });
    return this.findById(id);
  }

  async getDailySales(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await this.repo.createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'count')
      .addSelect('SUM(inv.grandTotal)', 'total')
      .addSelect('SUM(inv.taxTotal)', 'tax')
      .where('inv.invoiceDate = :date', { date: targetDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();
    return {
      date: targetDate,
      orderCount: Number(result?.count || 0),
      totalSales: Number(result?.total || 0),
      totalTax: Number(result?.tax || 0),
    };
  }

  async getSalesReport(fromDate: string, toDate: string) {
    const invoices = await this.repo.createQueryBuilder('inv')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .orderBy('inv.invoiceDate', 'DESC')
      .getMany();

    const totalSales = invoices.reduce((s, i) => s + Number(i.grandTotal), 0);
    const totalTax = invoices.reduce((s, i) => s + Number(i.taxTotal), 0);

    return {
      fromDate,
      toDate,
      invoiceCount: invoices.length,
      totalSales,
      totalTax,
      averageOrderValue: invoices.length > 0 ? totalSales / invoices.length : 0,
    };
  }

  async getGstReport(fromDate: string, toDate: string) {
    const invoices = await this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.invoiceDate BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .andWhere('inv.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getMany();

    const gstSummary: Record<string, { taxableValue: number; cgst: number; sgst: number; count: number }> = {};

    for (const inv of invoices) {
      for (const item of inv.items) {
        const rate = Number(item.gstRate);
        const key = `${rate}%`;
        if (!gstSummary[key]) gstSummary[key] = { taxableValue: 0, cgst: 0, sgst: 0, count: 0 };
        gstSummary[key].taxableValue += Number(item.taxableValue);
        gstSummary[key].cgst += Number(item.cgstAmount);
        gstSummary[key].sgst += Number(item.sgstAmount);
        gstSummary[key].count++;
      }
    }

    return {
      fromDate,
      toDate,
      invoiceCount: invoices.length,
      gstSummary,
      totalTax: invoices.reduce((s, i) => s + Number(i.taxTotal), 0),
    };
  }
}
