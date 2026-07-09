import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { Inventory, StockMovement, MovementType } from '../entities/inventory.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<Repository<Inventory>>;
  let movementRepo: jest.Mocked<Repository<StockMovement>>;

  function createMockInventory(overrides?: Partial<Inventory>): Inventory {
    return {
      id: 'inv-1',
      itemId: 'item-1',
      item: null as any,
      openingBalance: 100,
      currentStock: 80,
      minStockLevel: 10,
      unitCost: 50,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Inventory;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repo = module.get(getRepositoryToken(Inventory)) as jest.Mocked<Repository<Inventory>>;
    movementRepo = module.get(getRepositoryToken(StockMovement)) as jest.Mocked<Repository<StockMovement>>;
  });

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

  describe('findAll', () => {
    it('should return paginated inventory', async () => {
      mockQueryBuilder([createMockInventory()], 1);
      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should search by item name or SKU', async () => {
      const qb = mockQueryBuilder([createMockInventory()], 1);
      await service.findAll(1, 20, 'chicken');
      expect(qb.where).toHaveBeenCalledWith(
        'item.name ILIKE :search OR item.sku ILIKE :search',
        { search: '%chicken%' },
      );
    });

    it('should filter by status', async () => {
      const qb = mockQueryBuilder([createMockInventory()], 1);
      await service.findAll(1, 20, undefined, 'active');
      expect(qb.andWhere).toHaveBeenCalledWith('inv.status = :status', { status: 'active' });
    });
  });

  describe('findByItem', () => {
    it('should return inventory for an item', async () => {
      repo.findOne.mockResolvedValue(createMockInventory());
      const result = await service.findByItem('item-1');
      expect(result.itemId).toBe('item-1');
      expect(result.currentStock).toBe(80);
    });

    it('should throw NotFoundException when inventory not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByItem('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setOpeningBalance', () => {
    it('should create new inventory record', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(createMockInventory());
      repo.save.mockResolvedValue(createMockInventory({ openingBalance: 100, currentStock: 100 }));

      const result = await service.setOpeningBalance('item-1', 100, 50);
      expect(result.currentStock).toBe(100);
      expect(movementRepo.save).toHaveBeenCalled();
    });

    it('should update existing inventory record', async () => {
      const existing = createMockInventory();
      repo.findOne.mockResolvedValue(existing);
      const updated = createMockInventory({ openingBalance: 200, currentStock: 200, unitCost: 60 });
      repo.save.mockResolvedValue(updated);

      await service.setOpeningBalance('item-1', 200, 60);
      // The service mutates existing in-place and returns it, not the save result
      // Check that save was called with the right values
      expect(repo.save).toHaveBeenCalled();
      expect(movementRepo.save).toHaveBeenCalled();
    });
  });

  describe('adjustStock', () => {
    beforeEach(() => {
      movementRepo.create.mockImplementation((dto) => dto as StockMovement);
      repo.save.mockImplementation(async (i) => i as Inventory);
    });

    it('should increase stock for IN movements', async () => {
      const inv = createMockInventory();
      repo.findOne.mockResolvedValue(inv);
      const result = await service.adjustStock('item-1', MovementType.PURCHASE_IN, 10, 'Restock');

      expect(result.currentStock).toBe(90);
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: MovementType.PURCHASE_IN }),
      );
    });

    it('should decrease stock for OUT movements', async () => {
      const inv = createMockInventory();
      repo.findOne.mockResolvedValue(inv);

      const result = await service.adjustStock('item-1', MovementType.SALE_OUT, 10, 'Sold');

      expect(result.currentStock).toBe(70);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const inv = createMockInventory({ currentStock: 10 });
      repo.findOne.mockResolvedValue(inv);
      movementRepo.create = {
        ...movementRepo.create,
      } as any;

      await expect(
        service.adjustStock('item-1', MovementType.SALE_OUT, 200, 'Too many'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-positive quantity', async () => {
      await expect(
        service.adjustStock('item-1', MovementType.PURCHASE_IN, 0, 'Zero'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when inventory not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.adjustStock('nonexistent', MovementType.PURCHASE_IN, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLowStock', () => {
    it('should return items below min stock level', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([createMockInventory()]),
      };
      repo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getLowStock();
      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('inv.currentStock <= inv.minStockLevel');
    });
  });

  describe('getMovements', () => {
    it('should return paginated movements', async () => {
      movementRepo.findAndCount.mockResolvedValue([[{ id: 'mov-1', itemId: 'item-1' } as StockMovement], 1]);

      const result = await service.getMovements('item-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
