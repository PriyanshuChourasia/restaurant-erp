import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UnitConversion } from '../entities/unit-conversion.entity';

@Injectable()
export class UnitConversionRepository {
  constructor(
    @InjectRepository(UnitConversion)
    private readonly repo: Repository<UnitConversion>,
  ) {}

  async findByFromTo(itemId: string | null, fromUnitId: string, toUnitId: string): Promise<UnitConversion | null> {
    // Try item-specific first, then global
    if (itemId !== null) {
      const itemSpecific = await this.repo.findOne({
        where: { itemId, fromUnitId, toUnitId } as any,
      });
      if (itemSpecific) return itemSpecific;
    }

    // Global conversion (itemId IS NULL)
    return this.repo.findOne({
      where: { itemId: IsNull() as any, fromUnitId, toUnitId },
    });
  }

  async findConversionsForItem(itemId: string): Promise<UnitConversion[]> {
    return this.repo.find({
      where: [{ itemId: itemId as any }, { itemId: IsNull() as any }],
      relations: { fromUnit: true, toUnit: true },
    });
  }

  async create(data: Partial<UnitConversion>): Promise<UnitConversion> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async bulkCreate(data: Partial<UnitConversion>[]): Promise<UnitConversion[]> {
    const entities = this.repo.create(data);
    return this.repo.save(entities);
  }
}
