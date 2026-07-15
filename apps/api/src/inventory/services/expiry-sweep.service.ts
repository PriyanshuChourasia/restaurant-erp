import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { StockBatch, BatchStatus } from '../entities/stock-batch.entity';
import { InventoryService } from './inventory.service';
import { MovementType } from '../entities/inventory.entity';

@Injectable()
export class ExpirySweepService {
  private readonly logger = new Logger(ExpirySweepService.name);

  constructor(
    @InjectRepository(StockBatch)
    private readonly batchRepo: Repository<StockBatch>,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Daily expiry sweep at midnight (00:00).
   * Finds ALL active batches across all storage units whose expiryDate
   * is on or before today, writes off the remaining quantity as wastage,
   * and marks the batch status as EXPIRED.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sweepExpiredBatches(): Promise<void> {
    const today = new Date();

    // Find active batches whose expiryDate has passed.
    // Filter null expiry and zero-remaining in JS since TypeORM's find()
    // doesn't support combining LessThanOrEqual with MoreThan conveniently.
    const expiredBatches = await this.batchRepo.find({
      where: {
        status: BatchStatus.ACTIVE,
        expiryDate: LessThanOrEqual(today),
      },
    });

    const batches = expiredBatches.filter(
      (b) => b.expiryDate !== null && b.quantityRemaining > 0,
    );

    if (batches.length === 0) {
      this.logger.log('Expiry sweep: no expired batches found');
      return;
    }

    let totalQuantity = 0;
    let processedCount = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      const qtyToWriteOff = batch.quantityRemaining;

      try {
        await this.inventoryService.adjustStock(
          batch.itemId,
          MovementType.WASTAGE,
          qtyToWriteOff,
          `Auto write-off: batch ${batch.batchNumber} expired on ${batch.expiryDate?.toISOString().slice(0, 10)}`,
          `EXPIRY-SWEEP-${batch.id.slice(0, 8)}`,
          batch.storageUnitId,
        );

        // adjustStock internally calls consumeBatches() which already saved
        // the batch with quantityRemaining=0 and potentially status=EXHAUSTED.
        // We overwrite status=EXPIRED here to reflect the actual reason.
        batch.quantityRemaining = 0;
        batch.status = BatchStatus.EXPIRED;
        await this.batchRepo.save(batch);

        totalQuantity += qtyToWriteOff;
        processedCount++;
      } catch (err: any) {
        errors.push(`Batch ${batch.batchNumber} (${batch.id}): ${err.message}`);
        this.logger.error(
          `Expiry sweep failed for batch ${batch.batchNumber}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Expiry sweep complete: ${processedCount} batches processed, ` +
      `${totalQuantity} units written off as wastage` +
      (errors.length > 0 ? `, ${errors.length} errors` : ''),
    );

    if (errors.length > 0) {
      this.logger.warn(`Expiry sweep errors:\n${errors.join('\n')}`);
    }
  }
}
