import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PurchasesService } from './purchases.service';
import { Purchase, PurchaseItem, PurchaseStatus } from '../entities/purchase.entity';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let repo: jest.Mocked<Repository<Purchase>>;

  const mockPurchase: Purchase = {
    id: 'po-1',
    purchaseNumber: 'PO-000001',
    supplierId: 'sup-1',
    supplier: null as any,
    status: PurchaseStatus.ORDERED,
    purchaseDate: new Date(),
    subtotal: 1000,
    discount: 0,
    taxAmount: 50,
    totalAmount: 1050,
    notes: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        {
          provide: getRepositoryToken(Purchase),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    repo = module.get(getRepositoryToken(Purchase)) as jest.Mocked<Repository<Purchase>>;
  });

  // Helper to mock createQueryBuilder
  function mockQueryBuilder(returnData: any[], total: number) {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([returnData, total]),
    };
    repo.createQueryBuilder.mockReturnValue(queryBuilder as any);
    return queryBuilder;
  }

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return paginated purchases', async () => {
      mockQueryBuilder([mockPurchase], 1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = mockQueryBuilder([mockPurchase], 1);

      await service.findAll(1, 20, 'ordered');

      expect(qb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 'ordered' });
    });

    it('should search by purchase number or supplier name', async () => {
      const qb = mockQueryBuilder([mockPurchase], 1);

      await service.findAll(1, 20, undefined, 'PO-001');

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(p.purchaseNumber ILIKE :search OR supplier.name ILIKE :search)',
        { search: '%PO-001%' },
      );
    });
  });

  // ───── findById ─────

  describe('findById', () => {
    it('should return a purchase by ID', async () => {
      repo.findOne.mockResolvedValue(mockPurchase);

      const result = await service.findById('po-1');

      expect(result.id).toBe('po-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        relations: { supplier: true, items: true },
      });
    });

    it('should throw NotFoundException when purchase not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      supplierId: 'sup-1',
      purchaseDate: '2026-07-08',
      items: [
        { itemId: 'item-1', quantity: 10, unitPrice: 100, gstRate: 18 },
        { itemId: 'item-2', quantity: 5, unitPrice: 50, gstRate: 5 },
      ],
      notes: 'Test purchase',
    };

    it('should create a purchase order with correct calculations', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockPurchase as Purchase);
      repo.save.mockResolvedValue(mockPurchase);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseNumber: 'PO-000001',
          supplierId: 'sup-1',
          subtotal: 1250, // 10*100 + 5*50
          taxAmount: 192.5, // (1000*0.18) + (250*0.05) = 180 + 12.5
          totalAmount: 1442.5, // 1250 + 192.5
          status: PurchaseStatus.ORDERED,
        }),
      );
    });

    it('should handle empty items array', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockPurchase as Purchase);
      repo.save.mockResolvedValue(mockPurchase);

      const result = await service.create({ ...createDto, items: [] });

      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: 0, taxAmount: 0, totalAmount: 0 }),
      );
    });

    it('should increment purchase number', async () => {
      repo.count.mockResolvedValue(5);
      repo.create.mockReturnValue(mockPurchase as Purchase);
      repo.save.mockResolvedValue(mockPurchase);

      await service.create(createDto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ purchaseNumber: 'PO-000006' }),
      );
    });
  });

  // ───── updateStatus ─────

  describe('updateStatus', () => {
    it('should update purchase status', async () => {
      repo.findOne.mockResolvedValue(mockPurchase);
      repo.update.mockResolvedValue({ affected: 1 } as any);
      repo.findOne.mockResolvedValue({ ...mockPurchase, status: PurchaseStatus.RECEIVED });

      const result = await service.updateStatus('po-1', PurchaseStatus.RECEIVED);

      expect(repo.update).toHaveBeenCalledWith('po-1', { status: PurchaseStatus.RECEIVED });
      expect(result.status).toBe(PurchaseStatus.RECEIVED);
    });

    it('should throw NotFoundException when purchase not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', PurchaseStatus.RECEIVED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
