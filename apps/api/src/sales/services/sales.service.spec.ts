import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../entities/sales.entity';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;
  let repo: jest.Mocked<Repository<Invoice>>;

  const mockInvoice: Invoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-000001',
    customerName: 'Test Customer',
    customerPhone: null,
    customerGstin: null,
    tableNumber: null,
    tableNumbers: null,
    invoiceDate: new Date(),
    status: InvoiceStatus.DRAFT,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 1000,
    cgstTotal: 90,
    sgstTotal: 90,
    igstTotal: 0,
    taxTotal: 180,
    discount: 0,
    roundOff: 0,
    grandTotal: 1180,
    notes: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    repo = module.get(getRepositoryToken(Invoice)) as jest.Mocked<Repository<Invoice>>;
  });

  // Helper
  function mockQueryBuilder(returnData: any[], total: number) {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([returnData, total]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: 5, total: 5000, tax: 750 }),
      getMany: jest.fn().mockResolvedValue(returnData),
    };
    repo.createQueryBuilder.mockReturnValue(qb as any);
    return qb;
  }

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      mockQueryBuilder([mockInvoice], 1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status, search, and date range', async () => {
      const qb = mockQueryBuilder([mockInvoice], 1);

      await service.findAll(1, 20, 'confirmed', 'INV-001', '2026-01-01', '2026-12-31');

      expect(qb.andWhere).toHaveBeenCalledWith('inv.status = :status', { status: 'confirmed' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(inv.invoiceNumber ILIKE :search OR inv.customerName ILIKE :search)',
        { search: '%INV-001%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('inv.invoiceDate >= :fromDate', { fromDate: '2026-01-01' });
      expect(qb.andWhere).toHaveBeenCalledWith('inv.invoiceDate <= :toDate', { toDate: '2026-12-31' });
    });
  });

  // ───── findById ─────

  describe('findById', () => {
    it('should return an invoice by ID', async () => {
      repo.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findById('inv-1');

      expect(result.id).toBe('inv-1');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      customerName: 'New Customer',
      tableNumbers: ['Table 5'],
      paymentMethod: PaymentMethod.UPI as any,
      items: [
        {
          itemId: 'item-1',
          itemName: 'Butter Chicken',
          hsnCode: '2105',
          quantity: 2,
          unitPrice: 200,
          gstRate: 18,
        },
      ],
    };

    it('should create an invoice with correct GST calculations', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockInvoice as Invoice);
      repo.save.mockResolvedValue(mockInvoice);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: 'INV-000001',
          customerName: 'New Customer',
          tableNumbers: ['Table 5'],
          subtotal: 400, // 2 * 200
          cgstTotal: 36, // 400 * 9%
          sgstTotal: 36,
          grandTotal: 472, // 400 + 72
        }),
      );
    });

    it('should handle multiple items with different GST rates', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockInvoice as Invoice);
      repo.save.mockResolvedValue(mockInvoice);

      await service.create({
        ...createDto,
        items: [
          { itemId: 'item-1', itemName: 'Item 1', hsnCode: '2105', quantity: 1, unitPrice: 100, gstRate: 5 },
          { itemId: 'item-2', itemName: 'Item 2', hsnCode: '2202', quantity: 2, unitPrice: 50, gstRate: 12 },
        ],
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 200,
          // Item 1: 100 * 2.5% = 2.5 CGST | Item 2: 100 * 6% = 6 CGST → total 8.5
          cgstTotal: 8.5,
          sgstTotal: 8.5,
          taxTotal: 17,
          invoiceNumber: 'INV-000001',
        }),
      );
    });

    it('should apply discount', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockInvoice as Invoice);
      repo.save.mockResolvedValue(mockInvoice);

      await service.create({ ...createDto, discount: 50 });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ discount: 50 }),
      );
    });
  });

  // ───── updateStatus ─────

  describe('updateStatus', () => {
    it('should update invoice status', async () => {
      repo.findOne.mockResolvedValueOnce(mockInvoice);
      repo.update.mockResolvedValue({ affected: 1 } as any);
      repo.findOne.mockResolvedValueOnce({ ...mockInvoice, status: InvoiceStatus.COMPLETED });

      const result = await service.updateStatus('inv-1', InvoiceStatus.COMPLETED);

      expect(repo.update).toHaveBeenCalledWith('inv-1', { status: InvoiceStatus.COMPLETED });
      expect(result.status).toBe(InvoiceStatus.COMPLETED);
    });
  });

  // ───── getDailySales ─────

  describe('getDailySales', () => {
    it('should return daily sales summary', async () => {
      mockQueryBuilder([mockInvoice], 1);

      const result = await service.getDailySales();

      expect(result).toHaveProperty('orderCount');
      expect(result).toHaveProperty('totalSales');
      expect(result).toHaveProperty('totalTax');
    });
  });

  // ───── getSalesReport ─────

  describe('getSalesReport', () => {
    it('should return sales report between dates', async () => {
      mockQueryBuilder([mockInvoice], 1);

      const result = await service.getSalesReport('2026-01-01', '2026-12-31');

      expect(result).toHaveProperty('totalSales');
      expect(result).toHaveProperty('totalTax');
      expect(result).toHaveProperty('invoiceCount');
    });
  });
});
