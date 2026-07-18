import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Inventory, StockMovement, MovementType } from '../entities/inventory.entity';
import { StockBatch, BatchStatus } from '../entities/stock-batch.entity';
import { OpeningStockEntry } from '../entities/opening-stock-entry.entity';
import { StorageUnitsService } from './storage-units.service';
import { LedgerService } from '../../ledger/services/ledger.service';
import { JournalService, JournalLineInput } from '../../ledger/services/journal.service';
import { JournalSourceType } from '../../ledger/entities/journal-entry.entity';
import { LedgerAccount, LedgerEntryType, LedgerCategory } from '../../ledger/entities/ledger.entity';
import { StockItem } from '../../stock-items/entities/stock-item.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(OpeningStockEntry)
    private readonly openingStockRepo: Repository<OpeningStockEntry>,
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountRepo: Repository<LedgerAccount>,
    @InjectRepository(StockBatch)
    private readonly batchRepo: Repository<StockBatch>,
    @InjectRepository(StockItem)
    private readonly itemRepo: Repository<StockItem>,
    private readonly storageUnitsService: StorageUnitsService,
    private readonly ledgerService: LedgerService,
    private readonly journalService: JournalService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private async resolveStorageUnit(storageUnitId?: string): Promise<string> {
    if (storageUnitId) return storageUnitId;
    const defaultUnit = await this.storageUnitsService.findDefault();
    return defaultUnit.id;
  }

  /** Resolve an account by name, caching the ID after first lookup. */
  private accountIdCache = new Map<string, string>();
  private async getAccountId(name: string): Promise<string> {
    let id = this.accountIdCache.get(name);
    if (id) return id;
    const account = await this.ledgerAccountRepo.findOne({ where: { name } });
    if (!account) throw new NotFoundException(`Ledger account "${name}" not found`);
    this.accountIdCache.set(name, account.id);
    return account.id;
  }

  /**
   * Post double-entry ledger entries for a stock movement.
   * Called after the movement is saved (outside its transaction).
   *
   * Posting map:
   *   purchase_in:        DEBIT Inventory Asset (+ GST Input Credit) / CREDIT Purchase Payable
   *   sale_out:           DEBIT COGS / CREDIT Inventory Asset
   *   wastage:            DEBIT Wastage & Spoilage / CREDIT Inventory Asset
   *   adjustment_in:      DEBIT Inventory Asset / CREDIT Stock Adjustment
   *   adjustment_out:     DEBIT Stock Adjustment / CREDIT Inventory Asset
   *   production_*:       no ledger entry (value moves item→item, net zero)
   *   transfer_*:         no net ledger entry
   *   opening_balance:    no ledger entry (initial setup)
   */
  private async postLedgerForMovement(
    movement: StockMovement,
    unitCost: number,
    gstAmount?: number,
  ): Promise<void> {
    const amount = movement.quantity * unitCost;
    const entryDate = new Date(movement.createdAt).toISOString().split('T')[0];
    const ref = movement.reference || undefined;

    const type = movement.type;

    // Skip movements that don't affect the P&L / balance sheet
    if ([
      MovementType.OPENING_BALANCE,
      MovementType.PRODUCTION_CONSUMPTION,
      MovementType.PRODUCTION_YIELD,
      MovementType.TRANSFER_IN,
      MovementType.TRANSFER_OUT,
    ].includes(type)) {
      return;
    }

    const lines: JournalLineInput[] = [];
    let narration = '';

    switch (type) {
      case MovementType.PURCHASE_IN: {
        const invAssetId = await this.getAccountId('Inventory Asset');
        const purchasePayableId = await this.getAccountId('Purchase Payable');
        narration = `Purchase receipt: ${movement.quantity} units`;

        lines.push(
          { accountId: invAssetId, type: LedgerEntryType.DEBIT, amount, description: narration, category: LedgerCategory.PURCHASE },
          { accountId: purchasePayableId, type: LedgerEntryType.CREDIT, amount, description: narration, category: LedgerCategory.PURCHASE },
        );

        if (gstAmount && gstAmount > 0) {
          const gstInputId = await this.getAccountId('GST Input Credit');
          lines.push(
            { accountId: gstInputId, type: LedgerEntryType.DEBIT, amount: gstAmount, description: `GST input on purchase ${ref || ''}`, category: LedgerCategory.TAX },
            { accountId: purchasePayableId, type: LedgerEntryType.CREDIT, amount: gstAmount, description: `GST on purchase ${ref || ''}`, category: LedgerCategory.TAX },
          );
        }
        break;
      }

      case MovementType.SALE_OUT: {
        const cogsId = await this.getAccountId('COGS');
        const invAssetId = await this.getAccountId('Inventory Asset');
        narration = `COGS: ${movement.quantity} units sold`;

        lines.push(
          { accountId: cogsId, type: LedgerEntryType.DEBIT, amount, description: narration, category: LedgerCategory.SALES },
          { accountId: invAssetId, type: LedgerEntryType.CREDIT, amount, description: `Stock reduction: ${movement.quantity} units sold`, category: LedgerCategory.SALES },
        );
        break;
      }

      case MovementType.WASTAGE: {
        const wastageId = await this.getAccountId('Wastage & Spoilage');
        const invAssetId = await this.getAccountId('Inventory Asset');
        narration = `Wastage: ${movement.quantity} units`;

        lines.push(
          { accountId: wastageId, type: LedgerEntryType.DEBIT, amount, description: narration, category: LedgerCategory.EXPENSE },
          { accountId: invAssetId, type: LedgerEntryType.CREDIT, amount, description: `Stock reduction: ${movement.quantity} units wastage`, category: LedgerCategory.EXPENSE },
        );
        break;
      }

      case MovementType.ADJUSTMENT_IN: {
        const invAssetId = await this.getAccountId('Inventory Asset');
        const adjustmentId = await this.getAccountId('Stock Adjustment');
        narration = `Stock adjustment in: ${movement.quantity} units`;

        lines.push(
          { accountId: invAssetId, type: LedgerEntryType.DEBIT, amount, description: narration, category: LedgerCategory.MISCELLANEOUS },
          { accountId: adjustmentId, type: LedgerEntryType.CREDIT, amount, description: narration, category: LedgerCategory.MISCELLANEOUS },
        );
        break;
      }

      case MovementType.ADJUSTMENT_OUT: {
        const adjustmentId = await this.getAccountId('Stock Adjustment');
        const invAssetId = await this.getAccountId('Inventory Asset');
        narration = `Stock adjustment out: ${movement.quantity} units`;

        lines.push(
          { accountId: adjustmentId, type: LedgerEntryType.DEBIT, amount, description: narration, category: LedgerCategory.MISCELLANEOUS },
          { accountId: invAssetId, type: LedgerEntryType.CREDIT, amount, description: `Stock reduction: ${movement.quantity} units adjustment`, category: LedgerCategory.MISCELLANEOUS },
        );
        break;
      }
    }

    if (lines.length === 0) return;

    await this.journalService.post({
      date: entryDate,
      narration,
      sourceType: JournalSourceType.STOCK_MOVEMENT,
      sourceId: movement.id,
      reference: ref,
      lines,
    });
  }

  // ── Public methods ──────────────────────────────────────────

  async findAll(page = 1, limit = 20, search?: string, status?: string, storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const query = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('inv.storageUnit', 'storageUnit');

    query.where('inv.storageUnitId = :suId', { suId });

    if (search) {
      query.andWhere('(item.name ILIKE :search OR item.sku ILIKE :search)', { search: `%${search}%` });
    }
    if (status) query.andWhere('inv.status = :status', { status });

    query.orderBy('item.name', 'ASC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findByItem(itemId: string, storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const inv = await this.repo.findOne({
      where: { itemId, storageUnitId: suId },
      relations: { item: { category: true }, storageUnit: true },
    });
    if (!inv) {
      throw new NotFoundException(`Inventory not found for item ${itemId} at storage unit ${suId}`);
    }
    return inv;
  }

  async declareOpeningStock(
    itemId: string,
    storageUnitId: string,
    quantity: number,
    unitCost: number,
    asOfDate?: Date,
    createdBy?: string,
  ) {
    const existing = await this.openingStockRepo.findOne({
      where: { itemId, storageUnitId },
    });
    if (existing) {
      throw new ConflictException(
        `Opening stock already declared for item ${itemId} at storage unit ${storageUnitId} on ${existing.asOfDate.toISOString().split('T')[0]}`,
      );
    }

    const resolvedDate = asOfDate || new Date();

    return this.dataSource.transaction(async (manager) => {
      let inv = await manager.findOne(Inventory, {
        where: { itemId, storageUnitId },
      });
      if (!inv) {
        inv = manager.create(Inventory, {
          itemId, storageUnitId,
          openingBalance: quantity, currentStock: quantity,
          unitCost, minStockLevel: 0,
        });
      } else {
        inv.openingBalance = quantity;
        inv.currentStock = quantity;
        inv.unitCost = unitCost;
      }
      inv = await manager.save(inv);

      const movement = await manager.save(
        manager.create(StockMovement, {
          itemId, storageUnitId,
          type: MovementType.OPENING_BALANCE,
          quantity,
          balanceBefore: 0,
          balanceAfter: quantity,
          notes: 'Opening balance',
          reference: null,
          createdBy: createdBy || null,
        }),
      );

      const entry = manager.create(OpeningStockEntry, {
        itemId,
        storageUnitId,
        quantity,
        unitCost,
        asOfDate: resolvedDate,
        stockMovementId: movement.id,
        createdBy: createdBy || null,
      });
      await manager.save(entry);

      return inv;
    });
  }

  async setOpeningBalance(itemId: string, quantity: number, unitCost: number, storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const existing = await this.openingStockRepo.findOne({
      where: { itemId, storageUnitId: suId },
    });
    if (!existing) {
      return this.declareOpeningStock(itemId, suId, quantity, unitCost, new Date());
    }
    throw new ConflictException(
      `Opening stock already declared for this item at storage unit ${suId}. Use adjustStock instead.`,
    );
  }

  async getOpeningStock(itemId: string, storageUnitId?: string): Promise<OpeningStockEntry | null> {
    const suId = await this.resolveStorageUnit(storageUnitId);
    return this.openingStockRepo.findOne({
      where: { itemId, storageUnitId: suId },
    });
  }

  async getOpeningStockWithDetails(itemId: string, storageUnitId?: string) {
    const entry = await this.getOpeningStock(itemId, storageUnitId);
    if (!entry) return null;

    const movement = await this.movementRepo.findOne({
      where: { id: entry.stockMovementId },
    });
    const inv = await this.findByItem(itemId, storageUnitId);

    return {
      id: entry.id,
      itemId: entry.itemId,
      storageUnitId: entry.storageUnitId,
      quantity: entry.quantity,
      unitCost: entry.unitCost,
      asOfDate: entry.asOfDate,
      currentStock: inv.currentStock,
      createdAt: entry.createdAt,
      movementReference: movement?.id || null,
    };
  }

  /**
   * Pick batches for consumption using FEFO (First-Expiry-First-Out).
   * Returns an allocation of { batchId, quantity } that satisfies the total quantity.
   * Throws BadRequestException if insufficient stock across all active batches.
   */
  async pickBatchesForConsumption(
    itemId: string,
    storageUnitId: string,
    quantity: number,
  ): Promise<{ batchId: string; quantity: number }[]> {
    const batches = await this.batchRepo.find({
      where: { itemId, storageUnitId, status: BatchStatus.ACTIVE },
      order: { expiryDate: { direction: 'ASC', nulls: 'LAST' } as any, receivedDate: 'ASC' },
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    if (totalAvailable < quantity) {
      throw new BadRequestException(
        `Insufficient stock: need ${quantity}, but only ${totalAvailable} available across all batches`,
      );
    }

    const picks: { batchId: string; quantity: number }[] = [];
    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, batch.quantityRemaining);
      picks.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }

    return picks;
  }

  /**
   * Deduct from batches after a pick allocation.
   * Decrements quantityRemaining, marks exhausted if zero.
   */
  private async consumeBatches(
    picks: { batchId: string; quantity: number }[],
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(StockBatch) : this.batchRepo;
    for (const pick of picks) {
      const batch = await repo.findOne({ where: { id: pick.batchId } });
      if (!batch) continue; // safety guard
      batch.quantityRemaining -= pick.quantity;
      if (batch.quantityRemaining <= 0) {
        batch.quantityRemaining = 0;
        batch.status = BatchStatus.EXHAUSTED;
      }
      await repo.save(batch);
    }
  }

  async adjustStock(
    itemId: string,
    type: MovementType,
    quantity: number,
    notes?: string,
    reference?: string,
    storageUnitId?: string,
    transferGroupId?: string,
  ) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const suId = await this.resolveStorageUnit(storageUnitId);
    let inv = await this.repo.findOne({ where: { itemId, storageUnitId: suId } });
    if (!inv) throw new NotFoundException(`Inventory not found for item ${itemId} at ${suId}`);

    const balanceBefore = inv.currentStock;
    const isOut = [
      MovementType.SALE_OUT, MovementType.ADJUSTMENT_OUT,
      MovementType.WASTAGE, MovementType.TRANSFER_OUT,
      MovementType.PRODUCTION_CONSUMPTION,
    ].includes(type);
    const balanceAfter = isOut ? balanceBefore - quantity : balanceBefore + quantity;
    if (isOut && balanceAfter < 0) throw new BadRequestException('Insufficient stock');

    inv.currentStock = balanceAfter;
    await this.repo.save(inv);

    // For out-movements, pick from batches using FEFO
    if (isOut) {
      // Check if any active batches exist for this item
      const activeBatches = await this.batchRepo.count({
        where: { itemId, storageUnitId: suId, status: BatchStatus.ACTIVE },
      });

      if (activeBatches > 0) {
        const picks = await this.pickBatchesForConsumption(itemId, suId, quantity);
        await this.consumeBatches(picks);

        // Create one movement per batch pick
        for (const pick of picks) {
          await this.movementRepo.save(this.movementRepo.create({
            itemId, storageUnitId: suId, type, quantity: pick.quantity,
            balanceBefore, balanceAfter,
            batchId: pick.batchId,
            notes: notes || null, reference: reference || null,
            transferGroupId: transferGroupId || null,
          }));
        }
      } else {
        // No batches exist (e.g. opening balance stock) — create single movement
        await this.movementRepo.save(this.movementRepo.create({
          itemId, storageUnitId: suId, type, quantity,
          balanceBefore, balanceAfter,
          notes: notes || null, reference: reference || null,
          transferGroupId: transferGroupId || null,
        }));
      }
    } else {
      // For in-movements, create a single movement (no batch picking needed)
      await this.movementRepo.save(this.movementRepo.create({
        itemId, storageUnitId: suId, type, quantity, balanceBefore, balanceAfter,
        notes: notes || null, reference: reference || null, transferGroupId: transferGroupId || null,
      }));
    }

    // Post ledger entries for this movement
    await this.postLedgerForMovement(
      { itemId, storageUnitId: suId, type, quantity, balanceBefore, balanceAfter, reference: reference || null, notes: notes || null, createdAt: new Date() } as StockMovement,
      inv.unitCost,
    );

    return inv;
  }

  async transferStock(
    itemId: string,
    fromStorageUnitId: string,
    toStorageUnitId: string,
    quantity: number,
    reference?: string,
  ): Promise<{ from: Inventory; to: Inventory }> {
    if (fromStorageUnitId === toStorageUnitId) {
      throw new BadRequestException('Source and destination storage units must differ');
    }
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');

    const transferGroupId = uuidv4();

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const movRepo = manager.getRepository(StockMovement);
      const srcBatchRepo = manager.getRepository(StockBatch);

      const fromInv = await invRepo.findOne({
        where: { itemId, storageUnitId: fromStorageUnitId },
      });
      if (!fromInv) throw new NotFoundException(`No inventory for item ${itemId} at source`);
      if (fromInv.currentStock < quantity) {
        throw new BadRequestException('Insufficient stock at source');
      }

      fromInv.currentStock -= quantity;
      await invRepo.save(fromInv);

      let toInv = await invRepo.findOne({
        where: { itemId, storageUnitId: toStorageUnitId },
      });
      if (!toInv) {
        toInv = invRepo.create({
          itemId, storageUnitId: toStorageUnitId,
          openingBalance: 0, currentStock: quantity,
          unitCost: fromInv.unitCost, minStockLevel: 0,
        });
      } else {
        toInv.currentStock += quantity;
      }
      await invRepo.save(toInv);

      const balanceBeforeFrom = fromInv.currentStock + quantity;
      const balanceBeforeTo = toInv.currentStock - quantity;

      // ── Batch-aware transfer ───────────────────────────────
      // Check if active batches exist at the source storage unit
      const activeSourceBatches = await srcBatchRepo.count({
        where: { itemId, storageUnitId: fromStorageUnitId, status: BatchStatus.ACTIVE },
      });

      if (activeSourceBatches > 0) {
        // Pick from source batches using FEFO
        const batches = await srcBatchRepo.find({
          where: { itemId, storageUnitId: fromStorageUnitId, status: BatchStatus.ACTIVE },
          order: { expiryDate: { direction: 'ASC', nulls: 'LAST' } as any, receivedDate: 'ASC' },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
        if (totalAvailable < quantity) {
          throw new BadRequestException(
            `Insufficient batch stock at source: need ${quantity}, but only ${totalAvailable} available`,
          );
        }

        let remaining = quantity;
        for (const srcBatch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, srcBatch.quantityRemaining);

          // Deduct from source batch
          srcBatch.quantityRemaining -= take;
          if (srcBatch.quantityRemaining <= 0) {
            srcBatch.quantityRemaining = 0;
            srcBatch.status = BatchStatus.EXHAUSTED;
          }
          await srcBatchRepo.save(srcBatch);

          // Create destination batch with parentBatchId pointing to source batch
          const destBatch = srcBatchRepo.create({
            itemId,
            storageUnitId: toStorageUnitId,
            parentBatchId: srcBatch.id,
            batchNumber: `${srcBatch.batchNumber}-X-${toStorageUnitId.slice(0, 8)}`,
            quantityReceived: take,
            quantityRemaining: take,
            unitCost: srcBatch.unitCost,
            receivedDate: new Date(),
            expiryDate: srcBatch.expiryDate,
            status: BatchStatus.ACTIVE,
          });
          const savedDestBatch = await srcBatchRepo.save(destBatch);

          // TRANSFER_OUT movement for this batch pick
          await movRepo.save(movRepo.create({
            itemId, storageUnitId: fromStorageUnitId,
            type: MovementType.TRANSFER_OUT,
            quantity: take,
            balanceBefore: balanceBeforeFrom,
            balanceAfter: fromInv.currentStock,
            batchId: srcBatch.id,
            transferGroupId,
            reference: reference || null,
            notes: `Transfer ${take} units from batch ${srcBatch.batchNumber} to ${toStorageUnitId}`,
          }));

          // TRANSFER_IN movement for this batch pick
          await movRepo.save(movRepo.create({
            itemId, storageUnitId: toStorageUnitId,
            type: MovementType.TRANSFER_IN,
            quantity: take,
            balanceBefore: balanceBeforeTo,
            balanceAfter: toInv.currentStock,
            batchId: savedDestBatch.id,
            transferGroupId,
            reference: reference || null,
            notes: `Transfer ${take} units from ${fromStorageUnitId} (source batch: ${srcBatch.batchNumber})`,
          }));

          remaining -= take;
        }
      } else {
        // No batches exist — create single non-batch movements (fallback for opening-balance stock)
        await movRepo.save(movRepo.create({
          itemId, storageUnitId: fromStorageUnitId,
          type: MovementType.TRANSFER_OUT, quantity,
          balanceBefore: balanceBeforeFrom, balanceAfter: fromInv.currentStock,
          transferGroupId, reference: reference || null,
          notes: `Transfer to ${toStorageUnitId}`,
        }));

        await movRepo.save(movRepo.create({
          itemId, storageUnitId: toStorageUnitId,
          type: MovementType.TRANSFER_IN, quantity,
          balanceBefore: balanceBeforeTo, balanceAfter: toInv.currentStock,
          transferGroupId, reference: reference || null,
          notes: `Transfer from ${fromStorageUnitId}`,
        }));
      }

      return { from: fromInv, to: toInv };
    });
  }

  async postPurchaseReceipt(
    itemId: string,
    storageUnitId: string,
    quantity: number,
    unitCost: number,
    reference?: string,
    createdBy?: string,
    gstAmount?: number,
    manager?: EntityManager,
  ): Promise<Inventory> {
    const repo = manager ? manager.getRepository(Inventory) : this.repo;
    const movementRepo = manager ? manager.getRepository(StockMovement) : this.movementRepo;
    const batchRepo = manager ? manager.getRepository(StockBatch) : this.batchRepo;

    let inv = await repo.findOne({ where: { itemId, storageUnitId } });
    if (!inv) {
      inv = repo.create({
        itemId, storageUnitId,
        openingBalance: 0, currentStock: quantity,
        unitCost, minStockLevel: 0,
      });
    } else {
      const existingQty = inv.currentStock;
      const existingCost = inv.unitCost;
      const newAvgCost =
        (existingQty * existingCost + quantity * unitCost) / (existingQty + quantity);
      inv.unitCost = Math.round(newAvgCost * 100) / 100;
      inv.currentStock += quantity;
    }
    inv = await repo.save(inv);

    const balanceBefore = inv.currentStock - quantity;

    // Compute expiry date from item's shelfLifeDays
    const item = await (manager ? manager.getRepository(StockItem) : this.itemRepo).findOne({ where: { id: itemId } });
    const receivedDate = new Date();
    let expiryDate: Date | null = null;
    if (item?.shelfLifeDays && item.shelfLifeDays > 0) {
      const d = new Date(receivedDate);
      d.setDate(d.getDate() + item.shelfLifeDays);
      expiryDate = d;
    }

    // Create batch record
    const batchNumber = `B-${receivedDate.toISOString().slice(0, 10).replace(/-/g, '')}-${itemId.slice(0, 8)}`;
    const batch = await batchRepo.save(
      batchRepo.create({
        itemId, storageUnitId,
        batchNumber,
        quantityReceived: quantity,
        quantityRemaining: quantity,
        unitCost,
        receivedDate,
        expiryDate,
        status: BatchStatus.ACTIVE,
      }),
    );

    const movement = await movementRepo.save(
      movementRepo.create({
        itemId, storageUnitId,
        type: MovementType.PURCHASE_IN,
        quantity,
        balanceBefore,
        balanceAfter: inv.currentStock,
        batchId: batch.id,
        reference: reference || null,
        notes: 'Purchase receipt',
        createdBy: createdBy || null,
      }),
    );

    // Post ledger entries (outside transaction, but movement is already saved)
    await this.postLedgerForMovement(movement, inv.unitCost, gstAmount);

    return inv;
  }

  async getLowStock(storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    return this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.item', 'item')
      .where('inv.storageUnitId = :suId', { suId })
      .andWhere('inv.currentStock <= inv.minStockLevel')
      .andWhere('inv.status = :status', { status: 'active' })
      .orderBy('(inv.currentStock / inv.minStockLevel)', 'ASC')
      .getMany();
  }

  async getMovements(itemId: string, page = 1, limit = 20, storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const [data, total] = await this.movementRepo.findAndCount({
      where: { itemId, storageUnitId: suId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  // ── Batch tracking methods ──────────────────────────────

  async getAllBatches(storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    return this.batchRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('b.storageUnit', 'storageUnit')
      .where('b.storageUnitId = :suId', { suId })
      .orderBy('b.receivedDate', 'DESC')
      .addOrderBy('b.expiryDate', 'ASC')
      .getMany();
  }

  async getItemBatches(
    itemId: string,
    storageUnitId?: string,
    status?: BatchStatus,
  ) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const where: any = { itemId, storageUnitId: suId };
    if (status) where.status = status;
    return this.batchRepo.find({
      where,
      order: { expiryDate: { direction: 'ASC', nulls: 'LAST' } as any, receivedDate: 'ASC' },
    });
  }

  async getNearExpiryBatches(days: number = 7, storageUnitId?: string) {
    const suId = await this.resolveStorageUnit(storageUnitId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return this.batchRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.item', 'item')
      .where('b.storageUnitId = :suId', { suId })
      .andWhere('b.status = :status', { status: BatchStatus.ACTIVE })
      .andWhere('b.expiryDate IS NOT NULL')
      .andWhere('b.expiryDate <= :cutoff', { cutoff })
      .andWhere('b.quantityRemaining > 0')
      .orderBy('b.expiryDate', 'ASC')
      .getMany();
  }

  async getInventoryValuation() {
    const [inventoryAsset, computedItems] = await Promise.all([
      this.ledgerAccountRepo.findOne({ where: { name: 'Inventory Asset' } }),
      this.repo.createQueryBuilder('inv')
        .select('inv.currentStock', 'stock')
        .addSelect('inv.unitCost', 'cost')
        .getRawMany(),
    ]);

    const computedValuation = computedItems.reduce(
      (sum: number, r: any) => sum + Number(r.stock || 0) * Number(r.cost || 0),
      0,
    );

    const ledgerBalance = inventoryAsset ? Number(inventoryAsset.currentBalance) : 0;
    const diff = Math.round((computedValuation - ledgerBalance) * 100) / 100;

    return {
      ledgerBalance,
      computedValuation: Math.round(computedValuation * 100) / 100,
      diff,
      isReconciled: Math.abs(diff) < 0.01,
      itemCount: computedItems.length,
    };
  }
}
