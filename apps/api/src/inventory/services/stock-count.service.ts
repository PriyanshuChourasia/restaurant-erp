import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { StockCount, StockCountLine, StockCountStatus } from '../entities/stock-count.entity';
import { InventoryService } from './inventory.service';
import { Inventory } from '../entities/inventory.entity';
import { MovementType } from '../entities/inventory.entity';
import { StorageUnitsService } from './storage-units.service';

@Injectable()
export class StockCountService {
  constructor(
    @InjectRepository(StockCount)
    private readonly countRepo: Repository<StockCount>,
    @InjectRepository(StockCountLine)
    private readonly lineRepo: Repository<StockCountLine>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    private readonly inventoryService: InventoryService,
    private readonly storageUnitsService: StorageUnitsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new draft stock count for a storage unit.
   * Snapshots systemQuantity for each item from Inventory.currentStock.
   */
  async create(
    storageUnitId: string,
    itemIds: string[],
    userId?: string,
    countDate?: Date,
    notes?: string,
  ) {
    if (!itemIds.length) {
      throw new BadRequestException('At least one item must be specified');
    }

    await this.storageUnitsService.findById(storageUnitId);

    const count = await this.countRepo.save(
      this.countRepo.create({
        storageUnitId,
        countDate: countDate || new Date(),
        status: StockCountStatus.DRAFT,
        createdBy: userId || null,
        notes: notes || null,
      }),
    );

    // Snapshot current stock for each item at this storage unit
    const inventories = await this.inventoryRepo.find({
      where: { itemId: In(itemIds), storageUnitId },
    });
    const stockByItemId = new Map(inventories.map((inv) => [inv.itemId, inv.currentStock]));

    const lines = itemIds.map((itemId) => ({
      stockCountId: count.id,
      itemId,
      systemQuantity: stockByItemId.get(itemId) || 0,
      countedQuantity: null,
      variance: null,
    }));

    const savedLines = await this.lineRepo.save(
      lines.map((l) => this.lineRepo.create(l)),
    );

    return { ...count, lines: savedLines };
  }

  /**
   * Submit counted quantities for a draft stock count.
   * Fills in countedQuantity, computes variance = counted - system.
   * Does NOT post adjustments yet — allows re-counting before finalizing.
   * Only accepts lines belonging to this stock count.
   */
  async submitCounts(
    stockCountId: string,
    lines: { lineId: string; countedQuantity: number; notes?: string }[],
  ) {
    const count = await this.countRepo.findOne({ where: { id: stockCountId } });
    if (!count) throw new NotFoundException(`Stock count ${stockCountId} not found`);
    if (count.status === StockCountStatus.COMPLETED) {
      throw new ConflictException('Stock count is already completed');
    }

    const existingLines = await this.lineRepo.find({
      where: { stockCountId },
    });
    const lineMap = new Map(existingLines.map((l) => [l.id, l]));

    const updated: StockCountLine[] = [];

    for (const input of lines) {
      const line = lineMap.get(input.lineId);
      if (!line) {
        throw new NotFoundException(`Line ${input.lineId} not found in stock count ${stockCountId}`);
      }
      if (input.countedQuantity < 0) {
        throw new BadRequestException(`Counted quantity cannot be negative for line ${input.lineId}`);
      }
      line.countedQuantity = input.countedQuantity;
      line.variance = input.countedQuantity - line.systemQuantity;
      if (input.notes !== undefined) line.notes = input.notes;
      updated.push(line);
    }

    await this.lineRepo.save(updated);

    // Re-fetch with items for the response
    return this.findOne(stockCountId);
  }

  /**
   * Complete a draft stock count.
   * For each line with non-zero variance, posts an adjustment via
   * InventoryService.adjustStock() with reference 'STOCKCOUNT-<id>'.
   * Sets status to 'completed'. Rejects if already completed.
   */
  async complete(stockCountId: string, userId?: string) {
    const count = await this.countRepo.findOne({ where: { id: stockCountId } });
    if (!count) throw new NotFoundException(`Stock count ${stockCountId} not found`);
    if (count.status === StockCountStatus.COMPLETED) {
      throw new ConflictException('Stock count is already completed');
    }

    const lines = await this.lineRepo.find({
      where: { stockCountId },
    });

    const adjustments: { itemId: string; variance: number; line: StockCountLine }[] = [];
    for (const line of lines) {
      if (line.countedQuantity === null || line.countedQuantity === undefined) {
        throw new BadRequestException(
          `Line for item ${line.itemId} has not been counted yet. Submit counts before completing.`,
        );
      }
      if (line.variance === null || line.variance === undefined) {
        line.variance = line.countedQuantity - line.systemQuantity;
      }
      if (line.variance !== 0) {
        adjustments.push({ itemId: line.itemId, variance: line.variance, line });
      }
    }

    // Post adjustments inside a transaction for atomicity.
    // Note: adjustStock() uses its own entityManager (not the transaction manager),
    // so this wraps save operations. If the server crashes mid-loop partial
    // adjustments may be applied but the status update and save below are guarded.
    const reference = `STOCKCOUNT-${stockCountId}`;
    await this.dataSource.transaction(async (manager) => {
      for (const adj of adjustments) {
        const type = adj.variance > 0 ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT;
        const qty = Math.abs(adj.variance);
        await this.inventoryService.adjustStock(
          adj.itemId,
          type,
          qty,
          adj.line.notes || `Stock count correction: system=${adj.line.systemQuantity}, counted=${adj.line.countedQuantity}`,
          reference,
          count.storageUnitId,
        );
      }

      count.status = StockCountStatus.COMPLETED;
      await manager.getRepository(StockCount).save(count);
    });

    // Re-fetch with details in response
    return this.findOne(stockCountId);
  }

  async findAll(page = 1, limit = 20, storageUnitId?: string) {
    const where: any = {};
    if (storageUnitId) where.storageUnitId = storageUnitId;

    const [data, total] = await this.countRepo.findAndCount({
      where,
      relations: { storageUnit: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const count = await this.countRepo.findOne({
      where: { id },
      relations: { storageUnit: true },
    });
    if (!count) throw new NotFoundException(`Stock count ${id} not found`);

    const lines = await this.lineRepo.find({
      where: { stockCountId: id },
      relations: { item: true },
    });

    return { ...count, lines };
  }
}
