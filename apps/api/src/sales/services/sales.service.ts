import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../entities/sales.entity';
import { CreditNote, CreditNoteItem, CreditNoteStatus } from '../entities/credit-note.entity';
import { CreateCreditNoteDto } from '../dto/create-credit-note.dto';
import { PriceLevelsService } from '../../price-levels/services/price-levels.service';
import { TablesService } from '../../seating/services/tables.service';
import { CustomersService } from '../../customers/services/customers.service';
import { RecipesService } from '../../recipes/services/recipes.service';
import { StockItem } from '../../stock-items/entities/stock-item.entity';
import { Inventory, StockMovement, MovementType } from '../../inventory/entities/inventory.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { KotService } from '../../kot/services/kot.service';
import { KotStatus } from '../../kot/entities/kot.entity';
import { VouchersService } from '../../vouchers/services/vouchers.service';
import { JournalService, JournalLineInput } from '../../ledger/services/journal.service';
import { LedgerService } from '../../ledger/services/ledger.service';
import { LedgerEntryType, LedgerCategory } from '../../ledger/entities/ledger.entity';
import { JournalSourceType } from '../../ledger/entities/journal-entry.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly priceLevelsService: PriceLevelsService,
    private readonly tablesService: TablesService,
    private readonly customersService: CustomersService,
    private readonly recipesService: RecipesService,
    @InjectRepository(StockItem)
    private readonly itemRepo: Repository<StockItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(CreditNote)
    private readonly creditNoteRepo: Repository<CreditNote>,
    @InjectRepository(CreditNoteItem)
    private readonly creditNoteItemRepo: Repository<CreditNoteItem>,
    private readonly inventoryService: InventoryService,
    private readonly kotService: KotService,
    private readonly vouchersService: VouchersService,
    private readonly journalService: JournalService,
    private readonly ledgerService: LedgerService,
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
    orderId?: string;
    items: Array<{
      itemId: string;
      quantity: number;
    }>;
  }) {
    // Auto-fill customer info from record if not explicitly provided
    let effectiveCustomerName = dto.customerName || null;
    let effectiveCustomerPhone = dto.customerPhone || null;
    let effectiveCustomerGstin = dto.customerGstin || null;
    if (dto.customerId) {
      const customer = await this.customersService.findOne(dto.customerId);
      effectiveCustomerName = effectiveCustomerName || customer.name;
      effectiveCustomerPhone = effectiveCustomerPhone || customer.phone;
      effectiveCustomerGstin = effectiveCustomerGstin || customer.gstin;
    }

    // Resolve price level + per-item price/GST server-side (shared with OrdersService)
    const { itemEntities, subtotal, cgstTotal, sgstTotal, taxTotal } =
      await this.priceLevelsService.resolveLineItems(dto.items, dto.customerId);
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
      orderId: dto.orderId || null,
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
            storageUnitId: inv.storageUnitId,
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

    // Post accounting for this invoice: an immediate payment method (cash/card/upi/online)
    // generates a Receipt Voucher (money received now); a credit sale posts a bare journal
    // entry recognizing revenue against Accounts Receivable (nothing received yet).
    const netRevenue = subtotal - discount + roundOff;
    const paymentMethod = dto.paymentMethod || PaymentMethod.CASH;

    if (paymentMethod === PaymentMethod.CREDIT) {
      const receivableAccount = await this.ledgerService.getAccountByName('Accounts Receivable');
      const salesRevenueAccount = await this.ledgerService.getAccountByName('Sales Revenue');
      const lines: JournalLineInput[] = [
        { accountId: receivableAccount.id, type: LedgerEntryType.DEBIT, amount: finalTotal, description: `Invoice ${saved.invoiceNumber}` },
        { accountId: salesRevenueAccount.id, type: LedgerEntryType.CREDIT, amount: netRevenue, description: `Sale: Invoice ${saved.invoiceNumber}`, category: LedgerCategory.SALES },
      ];
      if (taxTotal > 0) {
        const gstPayableAccount = await this.ledgerService.getAccountByName('GST Payable');
        lines.push({ accountId: gstPayableAccount.id, type: LedgerEntryType.CREDIT, amount: taxTotal, description: `GST on Invoice ${saved.invoiceNumber}`, category: LedgerCategory.TAX });
      }
      const journalEntry = await this.journalService.post({
        narration: `Credit sale: Invoice ${saved.invoiceNumber}`,
        sourceType: JournalSourceType.INVOICE,
        sourceId: saved.id,
        reference: saved.invoiceNumber,
        lines,
      });
      saved.journalEntryId = journalEntry.id;
    } else {
      const salesRevenueAccount = await this.ledgerService.getAccountByName('Sales Revenue');
      const creditLines = [{ accountId: salesRevenueAccount.id, amount: netRevenue, description: `Sale: Invoice ${saved.invoiceNumber}` }];
      if (taxTotal > 0) {
        const gstPayableAccount = await this.ledgerService.getAccountByName('GST Payable');
        creditLines.push({ accountId: gstPayableAccount.id, amount: taxTotal, description: `GST on Invoice ${saved.invoiceNumber}` });
      }
      const voucher = await this.vouchersService.createReceiptVoucher({
        paymentMode: paymentMethod,
        amount: finalTotal,
        creditLines,
        narration: `Invoice ${saved.invoiceNumber}`,
        referenceInvoiceId: saved.id,
      });
      saved.journalEntryId = voucher.journalEntryId;
      saved.voucherId = voucher.id;
    }
    await this.repo.save(saved);

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
    if (status === InvoiceStatus.CANCELLED) {
      return this.cancel(id);
    }
    await this.findById(id);
    await this.repo.update(id, { status });
    return this.findById(id);
  }

  /**
   * Cancels a confirmed invoice: restores deducted stock, releases occupied tables,
   * cancels the linked KOT, and reverses the posted accounting — all before the invoice
   * itself is marked cancelled.
   */
  async cancel(id: string) {
    const invoice = await this.findById(id);
    if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.COMPLETED) {
      throw new BadRequestException(`Cannot cancel an invoice with status "${invoice.status}"`);
    }

    // Restore stock — mirrors the same recipe-or-direct branching used in create()
    for (const item of invoice.items) {
      const recipeReversed = await this.recipesService.reverseOnSale(
        item.itemId,
        item.quantity,
        invoice.invoiceNumber,
      );

      if (!recipeReversed) {
        const inv = await this.inventoryRepo.findOne({ where: { itemId: item.itemId } });
        if (inv) {
          await this.inventoryService.adjustStock(
            item.itemId,
            MovementType.ADJUSTMENT_IN,
            item.quantity,
            'Invoice cancelled',
            invoice.invoiceNumber,
            inv.storageUnitId,
          );
        }
      }
    }

    // Release tables
    if (invoice.tableIds && invoice.tableIds.length > 0) {
      await this.tablesService.bulkUpdateStatus(invoice.tableIds, 'available');
    }

    // Cancel linked KOT(s) — KOTs are pointed at the Order that produced this invoice when
    // one exists (the normal path via OrdersService.charge()); fall back to the invoice's
    // own id for invoices charged directly (no Order stage), matching the old POS flow.
    const kots = await this.kotService.findByOrderId(invoice.orderId || invoice.id);
    for (const kot of kots) {
      await this.kotService.updateStatus(kot.id, KotStatus.CANCELLED);
    }

    // Reverse accounting
    if (invoice.voucherId) {
      await this.vouchersService.cancelVoucher(invoice.voucherId);
    } else if (invoice.journalEntryId) {
      await this.journalService.reverse(invoice.journalEntryId, `Invoice ${invoice.invoiceNumber} cancelled`);
    }

    await this.repo.update(id, { status: InvoiceStatus.CANCELLED });

    // Keep the originating Order (if any) in sync — otherwise it stays stuck showing
    // "billed" forever even though its invoice is now cancelled.
    if (invoice.orderId) {
      await this.orderRepo.update(invoice.orderId, { status: OrderStatus.CANCELLED });
    }

    return this.findById(id);
  }

  /**
   * Issues a Credit Note against specific line items on an already-billed invoice — the
   * correct way to fix a wrong item after it's been served, without rewriting the original
   * invoice. Optionally rings up a replacement invoice for the correct item in the same call.
   */
  async createCreditNote(invoiceId: string, dto: CreateCreditNoteDto) {
    const invoice = await this.findById(invoiceId);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot issue a credit note against a cancelled invoice');
    }

    const creditNoteItems: Partial<CreditNoteItem>[] = [];
    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;

    for (const line of dto.items) {
      const invoiceItem = invoice.items.find((i) => i.id === line.invoiceItemId);
      if (!invoiceItem) {
        throw new NotFoundException(`Invoice item "${line.invoiceItemId}" not found on this invoice`);
      }

      const alreadyCredited = await this.creditNoteItemRepo
        .createQueryBuilder('cni')
        .innerJoin('cni.creditNote', 'cn')
        .where('cni.invoiceItemId = :invoiceItemId', { invoiceItemId: line.invoiceItemId })
        .andWhere('cn.status != :cancelled', { cancelled: CreditNoteStatus.CANCELLED })
        .select('COALESCE(SUM(cni.quantity), 0)', 'total')
        .getRawOne();
      const remaining = Number(invoiceItem.quantity) - Number(alreadyCredited?.total || 0);
      if (line.quantity > remaining) {
        throw new BadRequestException(
          `Cannot credit ${line.quantity}x "${invoiceItem.itemName}" — only ${remaining} remaining to credit on this invoice`,
        );
      }

      const taxableValue = line.quantity * Number(invoiceItem.unitPrice);
      const gstRateHalf = Number(invoiceItem.gstRate) / 2;
      const cgstAmount = (taxableValue * gstRateHalf) / 100;
      const sgstAmount = (taxableValue * gstRateHalf) / 100;

      subtotal += taxableValue;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;

      creditNoteItems.push({
        invoiceItemId: invoiceItem.id,
        itemId: invoiceItem.itemId,
        itemName: invoiceItem.itemName,
        quantity: line.quantity,
        unitPrice: invoiceItem.unitPrice,
        taxableValue,
        gstRate: invoiceItem.gstRate,
        cgstAmount,
        sgstAmount,
        totalAmount: taxableValue + cgstAmount + sgstAmount,
        stockRestored: line.restoreStock,
      });

      // Restore stock for this line only if requested — mirrors cancel()'s branching
      if (line.restoreStock) {
        const recipeReversed = await this.recipesService.reverseOnSale(
          invoiceItem.itemId,
          line.quantity,
          invoice.invoiceNumber,
        );
        if (!recipeReversed) {
          const inv = await this.inventoryRepo.findOne({ where: { itemId: invoiceItem.itemId } });
          if (inv) {
            await this.inventoryService.adjustStock(
              invoiceItem.itemId,
              MovementType.ADJUSTMENT_IN,
              line.quantity,
              'Credit note',
              invoice.invoiceNumber,
              inv.storageUnitId,
            );
          }
        }
      }
    }

    const taxTotal = cgstTotal + sgstTotal;
    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

    const count = await this.creditNoteRepo.count();
    const creditNoteNumber = `CN-${String(count + 1).padStart(6, '0')}`;

    // Reverse the credited portion of the sale: Debit Sales Revenue + GST Payable,
    // Credit whichever account the original payment debited (Cash/Bank, or Accounts
    // Receivable if it was a credit sale) — the mirror image of the original posting.
    const creditAccount = invoice.paymentMethod === PaymentMethod.CREDIT
      ? await this.ledgerService.getAccountByName('Accounts Receivable')
      : await this.ledgerService.getAccountByName(invoice.paymentMethod === PaymentMethod.CASH ? 'Cash Account' : 'Bank Account');
    const salesRevenueAccount = await this.ledgerService.getAccountByName('Sales Revenue');
    const lines: JournalLineInput[] = [
      { accountId: salesRevenueAccount.id, type: LedgerEntryType.DEBIT, amount: subtotal, description: `Credit note ${creditNoteNumber} for Invoice ${invoice.invoiceNumber}`, category: LedgerCategory.SALES },
    ];
    if (taxTotal > 0) {
      const gstPayableAccount = await this.ledgerService.getAccountByName('GST Payable');
      lines.push({ accountId: gstPayableAccount.id, type: LedgerEntryType.DEBIT, amount: taxTotal, description: `GST reversed on credit note ${creditNoteNumber}`, category: LedgerCategory.TAX });
    }
    lines.push({ accountId: creditAccount.id, type: LedgerEntryType.CREDIT, amount: grandTotal, description: `Credit note ${creditNoteNumber}` });

    const journalEntry = await this.journalService.post({
      narration: `Credit note ${creditNoteNumber} for Invoice ${invoice.invoiceNumber}: ${dto.reason || 'item correction'}`,
      sourceType: JournalSourceType.CREDIT_NOTE,
      sourceId: invoice.id,
      reference: creditNoteNumber,
      lines,
    });

    const creditNote = this.creditNoteRepo.create({
      creditNoteNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reason: dto.reason || null,
      subtotal,
      cgstTotal,
      sgstTotal,
      taxTotal,
      grandTotal,
      journalEntryId: journalEntry.id,
      items: creditNoteItems as CreditNoteItem[],
    });
    const savedCreditNote = await this.creditNoteRepo.save(creditNote);

    // Optionally ring up the replacement item(s) as a normal follow-on sale
    let replacementInvoice: Invoice | null = null;
    if (dto.replacementItems && dto.replacementItems.length > 0) {
      replacementInvoice = await this.create({
        customerId: invoice.customerId || undefined,
        customerName: invoice.customerName || undefined,
        customerPhone: invoice.customerPhone || undefined,
        customerGstin: invoice.customerGstin || undefined,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        notes: `Replacement for credit note ${creditNoteNumber} (Invoice ${invoice.invoiceNumber})`,
        items: dto.replacementItems,
      });
      savedCreditNote.replacementInvoiceId = replacementInvoice.id;
      await this.creditNoteRepo.save(savedCreditNote);
    }

    return { creditNote: savedCreditNote, replacementInvoice };
  }

  async findCreditNotesByInvoice(invoiceId: string) {
    return this.creditNoteRepo.find({
      where: { invoiceId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
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
