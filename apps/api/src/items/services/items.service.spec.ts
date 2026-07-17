import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemRepository } from '../repositories/item.repository';
import { Item, GstRate, ProductType } from '../entities/item.entity';

describe('ItemsService', () => {
  let service: ItemsService;
  let repository: jest.Mocked<ItemRepository>;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Butter Chicken',
    description: 'Delicious butter chicken',
    sku: 'M-001',
    hsnCode: '2105',
    price: 349,
    costPrice: 200,
    gstRate: GstRate.FIVE,
    unitId: 'uom-bowl',
    unit: { id: 'uom-bowl', superKey: 1, symbol: 'bowl', name: 'Bowl', description: null, baseUnitId: null, conversionFactor: 1, decimalAllowed: false, isActive: true, createdAt: new Date(), updatedAt: new Date() } as any,
    purchaseUnitId: null,
    purchaseUnit: null,
    itemType: 'goods' as any,
    isTaxable: true,
    cessPercent: 0,
    reverseCharge: false,
    productType: ProductType.FINISHED,
    isActive: true,
    isVeg: false,
    image: null,
    categoryId: null,
    category: null,
    shelfLifeDays: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: ItemRepository,
          useValue: {
            findById: jest.fn(),
            findBySku: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    repository = module.get(ItemRepository) as jest.Mocked<ItemRepository>;
  });

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return paginated items', async () => {
      const paginatedResult = {
        items: [mockItem],
        total: 1,
        page: 1,
        limit: 20,
      };
      repository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1, limit: 20, search: undefined,
        categoryId: undefined, isActive: undefined, isVeg: undefined,
      });
    });

    it('should pass query params to repository', async () => {
      repository.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({ page: 2, limit: 10, search: 'chicken', categoryId: 'cat-1', isActive: true, isVeg: false });

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 2, limit: 10, search: 'chicken',
        categoryId: 'cat-1', isActive: true, isVeg: false,
      });
    });
  });

  // ───── findById ─────

  describe('findById', () => {
    it('should return an item by ID', async () => {
      repository.findById.mockResolvedValue(mockItem);

      const result = await service.findById('item-1');

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Butter Chicken');
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      name: 'New Item',
      sku: 'NEW-001',
      hsnCode: '210690',
      price: 199,
      gstRate: GstRate.EIGHTEEN,
      unitId: 'uom-piece',
      isVeg: true,
    };

    it('should create an item', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...mockItem, ...createDto, id: 'new-id' });

      const result = await service.create(createDto);

      expect(result.sku).toBe('NEW-001');
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        sku: 'NEW-001',
        gstRate: GstRate.EIGHTEEN,
      }));
    });

    it('should use default GST rate when not provided', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...mockItem, ...createDto, gstRate: GstRate.EIGHTEEN });

      await service.create({ ...createDto, gstRate: undefined as any });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gstRate: GstRate.EIGHTEEN }),
      );
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      repository.findBySku.mockResolvedValue(mockItem);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  // ───── update ─────

  describe('update', () => {
    it('should update an item', async () => {
      repository.findById.mockResolvedValue(mockItem);
      repository.update.mockResolvedValue({ ...mockItem, name: 'Updated Item' });

      const result = await service.update('item-1', { name: 'Updated Item' });

      expect(result.name).toBe('Updated Item');
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      repository.findById.mockResolvedValue(mockItem);
      repository.findBySku.mockResolvedValue({ ...mockItem, id: 'other-item' });

      await expect(
        service.update('item-1', { sku: 'TAKEN-SKU' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating with own SKU (no conflict)', async () => {
      repository.findById.mockResolvedValue(mockItem);
      repository.findBySku.mockResolvedValue(mockItem);
      repository.update.mockResolvedValue({ ...mockItem, sku: 'M-001' });

      const result = await service.update('item-1', { sku: 'M-001' });

      expect(result.sku).toBe('M-001');
    });
  });

  // ───── remove ─────

  describe('remove', () => {
    it('should soft-delete an item', async () => {
      repository.findById.mockResolvedValue(mockItem);

      await service.remove('item-1');

      expect(repository.softDelete).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── restore ─────

  describe('restore', () => {
    it('should restore a deleted item', async () => {
      repository.restore.mockResolvedValue(undefined as any);

      await service.restore('item-1');

      expect(repository.restore).toHaveBeenCalledWith('item-1');
    });
  });

  // ───── getGstBreakdown ─────

  describe('getGstBreakdown', () => {
    it('should calculate GST breakdown correctly', async () => {
      const result = await service.getGstBreakdown(118, GstRate.EIGHTEEN);

      expect(result.taxableValue).toBe(100);
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);
      expect(result.totalGst).toBe(18);
      expect(result.rate).toBe(18);
    });

    it('should handle 0% GST rate', async () => {
      const result = await service.getGstBreakdown(100, GstRate.NIL);

      expect(result.taxableValue).toBe(100);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.totalGst).toBe(0);
    });
  });
});
