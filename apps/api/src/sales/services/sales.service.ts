import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../entities/sales.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
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
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string;
    tableNumbers?: string[];
    paymentMethod?: PaymentMethod;
    discount?: number;
    notes?: string;
    items: Array<{
      itemId: string;
      itemName: string;
      hsnCode: string;
      quantity: number;
      unitPrice: number;
      gstRate: number;
    }>;
  }) {
    const itemEntities = dto.items.map((i) => {
      const taxableValue = i.quantity * i.unitPrice;
      const gstRateHalf = i.gstRate / 2;
      const cgstAmount = (taxableValue * gstRateHalf) / 100;
      const sgstAmount = (taxableValue * gstRateHalf) / 100;
      const totalAmount = taxableValue + cgstAmount + sgstAmount;
      return { ...i, taxableValue, cgstAmount, sgstAmount, totalAmount };
    });

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
      customerName: dto.customerName || null,
      customerPhone: dto.customerPhone || null,
      customerGstin: dto.customerGstin || null,
      tableNumbers: dto.tableNumbers && dto.tableNumbers.length > 0 ? dto.tableNumbers : null,
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
    return this.repo.save(invoice);
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
