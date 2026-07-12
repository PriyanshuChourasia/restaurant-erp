import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { KotService } from './kot.service';
import { Kot, KotItem, KotStatus, KotStation } from '../entities/kot.entity';

describe('KotService', () => {
  let service: KotService;
  let repo: jest.Mocked<Repository<Kot>>;

  const baseKot: Kot = {
    id: 'kot-1',
    kotNumber: 'KOT-00001',
    orderId: null,
    tableIds: null,
    status: KotStatus.PENDING,
    station: KotStation.MAIN_KITCHEN,
    notes: null,
    preparedBy: null,
    startedAt: null,
    completedAt: null,
    servedAt: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KotService,
        {
          provide: getRepositoryToken(Kot),
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

    service = module.get<KotService>(KotService);
    repo = module.get(getRepositoryToken(Kot)) as jest.Mocked<Repository<Kot>>;
  });

  function mockQueryBuilder(returnData: any[], total: number) {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([returnData, total]),
      getMany: jest.fn().mockResolvedValue(returnData),
    };
    repo.createQueryBuilder.mockReturnValue(qb as any);
    return qb;
  }

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return paginated KOTs', async () => {
      mockQueryBuilder([baseKot], 1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status and station', async () => {
      const qb = mockQueryBuilder([baseKot], 1);

      await service.findAll(1, 20, 'pending', 'main_kitchen');

      expect(qb.andWhere).toHaveBeenCalledWith('kot.status = :status', { status: 'pending' });
      expect(qb.andWhere).toHaveBeenCalledWith('kot.station = :station', { station: 'main_kitchen' });
    });
  });

  // ───── findById ─────

  describe('findById', () => {
    it('should return a KOT by ID', async () => {
      repo.findOne.mockResolvedValue(baseKot);

      const result = await service.findById('kot-1');

      expect(result.id).toBe('kot-1');
    });

    it('should throw NotFoundException when KOT not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      orderId: 'inv-1',          tableIds: ['Table 7'],
      station: KotStation.MAIN_KITCHEN as KotStation,
      items: [
        { itemId: 'item-1', itemName: 'Butter Chicken', quantity: 2 },
        { itemId: 'item-2', itemName: 'Naan Bread', quantity: 3, instructions: 'Extra butter' },
      ],
    };

    it('should create a KOT with items', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(baseKot as Kot);
      repo.save.mockResolvedValue(baseKot);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kotNumber: 'KOT-00001',
          orderId: 'inv-1',
          tableIds: ['Table 7'],
          station: KotStation.MAIN_KITCHEN,
          status: KotStatus.PENDING,
          items: expect.arrayContaining([
            expect.objectContaining({ itemId: 'item-1', quantity: 2 }),
            expect.objectContaining({ itemId: 'item-2', quantity: 3, instructions: 'Extra butter' }),
          ]),
        }),
      );
    });

    it('should increment KOT number', async () => {
      repo.count.mockResolvedValue(42);
      repo.create.mockReturnValue(baseKot as Kot);
      repo.save.mockResolvedValue(baseKot);

      await service.create(createDto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ kotNumber: 'KOT-00043' }),
      );
    });
  });

  // ───── updateStatus ─────

  describe('updateStatus', () => {
    it('should update KOT status and set timestamps', async () => {
      const kotWithItems = { ...baseKot, items: [{ id: 'ki-1', status: KotStatus.READY } as KotItem] };
      repo.findOne.mockResolvedValue(kotWithItems);
      repo.update.mockResolvedValue({ affected: 1 } as any);
      repo.findOne.mockResolvedValue({ ...kotWithItems, status: KotStatus.READY, completedAt: new Date() });

      const result = await service.updateStatus('kot-1', KotStatus.READY);

      expect(repo.update).toHaveBeenCalledWith('kot-1', expect.objectContaining({ status: KotStatus.READY }));
      expect(result.status).toBe(KotStatus.READY);
    });

    it('should throw NotFoundException when KOT not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent', KotStatus.PREPARING)).rejects.toThrow(NotFoundException);
    });
  });

  // ───── updateItemStatus ─────

  describe('updateItemStatus', () => {
    const kotWithItems: Kot = {
      ...baseKot,
      items: [
        { id: 'ki-1', kotId: 'kot-1', kot: null as any, itemId: 'item-1', itemName: 'Item 1', quantity: 1, instructions: null, status: KotStatus.PENDING },
        { id: 'ki-2', kotId: 'kot-1', kot: null as any, itemId: 'item-2', itemName: 'Item 2', quantity: 1, instructions: null, status: KotStatus.PENDING },
      ] as KotItem[],
    };

    it('should update individual item status', async () => {
      repo.findOne.mockResolvedValue(kotWithItems);
      repo.save.mockResolvedValue(kotWithItems);

      await service.updateItemStatus('kot-1', 'ki-1', KotStatus.PREPARING);

      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      repo.findOne.mockResolvedValue(kotWithItems);

      await expect(
        service.updateItemStatus('kot-1', 'nonexistent', KotStatus.READY),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-update KOT status when all items are ready', async () => {
      const allReadyKot: Kot = {
        ...kotWithItems,
        items: kotWithItems.items.map((i) => ({ ...i, status: KotStatus.READY })),
      };
      repo.findOne.mockResolvedValue(allReadyKot);
      repo.save.mockResolvedValue(allReadyKot);

      await service.updateItemStatus('kot-1', 'ki-1', KotStatus.READY);

      expect(repo.update).toHaveBeenCalledWith('kot-1', expect.objectContaining({ status: KotStatus.READY }));
    });
  });

  // ───── getActiveKots ─────

  describe('getActiveKots', () => {
    it('should return pending and preparing KOTs', async () => {
      const qb = mockQueryBuilder([baseKot], 1);

      const result = await service.getActiveKots();

      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith(
        'kot.status IN (:...statuses)',
        { statuses: [KotStatus.PENDING, KotStatus.PREPARING] },
      );
    });

    it('should filter by station', async () => {
      const qb = mockQueryBuilder([baseKot], 1);

      await service.getActiveKots('main_kitchen');

      expect(qb.andWhere).toHaveBeenCalledWith('kot.station = :station', { station: 'main_kitchen' });
    });
  });
});
