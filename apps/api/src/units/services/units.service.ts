import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UnitRepository } from '../repositories/unit.repository';
import { UnitConversionRepository } from '../repositories/unit-conversion.repository';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import {
  formatQuantity as fmtQty,
  compactQuantity as cmpQty,
  toLargerUnit as toLgUnit,
} from '../../shared/utils/format-quantity';

@Injectable()
export class UnitsService {
  constructor(
    private readonly unitRepo: UnitRepository,
    private readonly conversionRepo: UnitConversionRepository,
  ) {}

  async findAll(includeInactive = false): Promise<UnitOfMeasure[]> {
    return this.unitRepo.findAll(includeInactive);
  }

  async findById(id: string): Promise<UnitOfMeasure> {
    const unit = await this.unitRepo.findById(id);
    if (!unit) throw new NotFoundException(`Unit with ID "${id}" not found`);
    return unit;
  }

  async findByCode(code: string): Promise<UnitOfMeasure | null> {
    return this.unitRepo.findByCode(code);
  }

  /**
   * Convert a quantity from one unit to another.
   * Tries item-specific conversion first, falls back to global conversion.
   * Throws BadRequestException if no conversion exists.
   */
  async convert(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    itemId?: string | null,
  ): Promise<number> {
    if (fromUnitId === toUnitId) return quantity;
    if (quantity < 0) throw new BadRequestException('Quantity must be non-negative');

    // Try item-specific conversion, fall back to global
    const conversion = await this.conversionRepo.findByFromTo(
      itemId ?? null,
      fromUnitId,
      toUnitId,
    );

    if (!conversion) {
      // Try reverse direction
      const reverseConversion = await this.conversionRepo.findByFromTo(
        itemId ?? null,
        toUnitId,
        fromUnitId,
      );
      if (!reverseConversion) {
        throw new BadRequestException(
          `No conversion found between unit "${fromUnitId}" and unit "${toUnitId}"${
            itemId ? ` for item "${itemId}"` : ''
          }`,
        );
      }
      return quantity / reverseConversion.factor;
    }

    return quantity * conversion.factor;
  }

  /**
   * Get all conversions available for an item (item-specific + global).
   * Used by the frontend to show available unit pairs.
   */
  async getConversionsForItem(itemId: string) {
    return this.conversionRepo.findConversionsForItem(itemId);
  }

  // ── Multi-unit formatting ───────────────────────────────────

  /**
   * Format a single quantity into a human-readable string.
   * E.g. "3400 gram" → "3 kg 400 g"
   */
  formatQuantity(quantity: number, unit: string): string {
    return fmtQty(quantity, unit);
  }

  /**
   * Compact format — shows in larger unit with decimals.
   * E.g. "3400 gram" → "3.4 kg"
   */
  compactQuantity(quantity: number, unit: string): string {
    return cmpQty(quantity, unit);
  }

  /**
   * Get the larger-unit numeric equivalent.
   * E.g. "3400 gram" → { value: 3.4, unit: 'kg' }
   */
  toLargerUnit(quantity: number, unit: string): { value: number; unit: string } {
    return toLgUnit(quantity, unit);
  }

  /**
   * Format multiple quantities in batch.
   * Returns an array with both the raw and formatted values.
   */
  formatQuantityBatch(
    items: Array<{ quantity: number; unit: string }>,
    variant: 'full' | 'compact' = 'full',
  ): Array<{ quantity: number; unit: string; formatted: string }> {
    const fn = variant === 'compact' ? cmpQty : fmtQty;
    return items.map(({ quantity, unit }) => ({
      quantity,
      unit,
      formatted: fn(quantity, unit),
    }));
  }
}
