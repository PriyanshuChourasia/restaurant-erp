import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { PriceLevelRepository } from '../repositories/price-level.repository';
import { ItemPriceLevelRepository } from '../repositories/item-price-level.repository';
import { CreatePriceLevelDto } from '../dto/create-price-level.dto';
import { UpdatePriceLevelDto } from '../dto/update-price-level.dto';
import { QueryPriceLevelDto } from '../dto/query-price-level.dto';
import { BulkUpsertItemPriceDto } from '../dto/bulk-upsert-item-price.dto';
import { PriceLevel } from '../entities/price-level.entity';
import { Item } from '../../items/entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemPriceLevel } from '../entities/item-price-level.entity';

@Injectable()
export class PriceLevelsService {
  constructor(
    private readonly priceLevelRepo: PriceLevelRepository,
    private readonly itemPriceLevelRepo: ItemPriceLevelRepository,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ───── CRUD ─────

  async findAll(query: QueryPriceLevelDto) {
    return this.priceLevelRepo.findAll(query);
  }

  async findAllActive(): Promise<PriceLevel[]> {
    return this.priceLevelRepo.findAllActive();
  }

  async findOne(id: string): Promise<PriceLevel> {
    const priceLevel = await this.priceLevelRepo.findById(id);
    if (!priceLevel) {
      throw new NotFoundException(`Price level with ID "${id}" not found`);
    }
    return priceLevel;
  }

  async create(dto: CreatePriceLevelDto): Promise<PriceLevel> {
    // Check unique name
    const existingByName = await this.priceLevelRepo.findByCode(dto.code);
    if (existingByName) {
      throw new ConflictException(`Price level with code "${dto.code}" already exists`);
    }

    // If this is the first price level or isDefault is true, ensure default is handled
    if (dto.isDefault) {
      return this.createWithDefault(dto);
    }

    return this.priceLevelRepo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
    });
  }

  private async createWithDefault(dto: CreatePriceLevelDto): Promise<PriceLevel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Unset default on all other price levels
      await queryRunner.manager
        .createQueryBuilder()
        .update(PriceLevel)
        .set({ isDefault: false })
        .where('isDefault = :val', { val: true })
        .execute();

      const entity = queryRunner.manager.create(PriceLevel, {
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        isDefault: true,
        isActive: dto.isActive ?? true,
      });
      const saved = await queryRunner.manager.save(entity);

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdatePriceLevelDto): Promise<PriceLevel> {
    const priceLevel = await this.findOne(id);

    if (priceLevel.deletedAt) {
      throw new BadRequestException('Cannot update a deleted price level');
    }

    if (dto.code && dto.code !== priceLevel.code) {
      const existing = await this.priceLevelRepo.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Price level with code "${dto.code}" already exists`);
      }
    }

    if (dto.isDefault) {
      return this.updateWithDefault(id, dto);
    }

    const updateData: Partial<PriceLevel> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

    return this.priceLevelRepo.update(id, updateData);
  }

  private async updateWithDefault(id: string, dto: UpdatePriceLevelDto): Promise<PriceLevel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Unset default on all other price levels
      await queryRunner.manager
        .createQueryBuilder()
        .update(PriceLevel)
        .set({ isDefault: false })
        .where('isDefault = :val', { val: true })
        .andWhere('id != :excludeId', { excludeId: id })
        .execute();

      const updateData: Partial<PriceLevel> = { isDefault: true };
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.code !== undefined) updateData.code = dto.code;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      await queryRunner.manager.update(PriceLevel, id, updateData);
      const saved = await queryRunner.manager.findOneOrFail(PriceLevel, { where: { id } });

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.priceLevelRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.priceLevelRepo.restore(id);
  }

  // ───── Actions ─────

  async activate(id: string): Promise<PriceLevel> {
    const priceLevel = await this.findOne(id);
    if (priceLevel.deletedAt) {
      throw new BadRequestException('Cannot activate a deleted price level');
    }
    return this.priceLevelRepo.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<PriceLevel> {
    const priceLevel = await this.findOne(id);
    if (priceLevel.deletedAt) {
      throw new BadRequestException('Cannot deactivate a deleted price level');
    }
    return this.priceLevelRepo.update(id, { isActive: false });
  }

  async setDefault(id: string): Promise<PriceLevel> {
    const priceLevel = await this.findOne(id);
    if (priceLevel.deletedAt) {
      throw new BadRequestException('Cannot set a deleted price level as default');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Unset default on all other price levels
      await queryRunner.manager
        .createQueryBuilder()
        .update(PriceLevel)
        .set({ isDefault: false })
        .where('isDefault = :val', { val: true })
        .execute();

      await queryRunner.manager.update(PriceLevel, id, { isDefault: true });
      const saved = await queryRunner.manager.findOneOrFail(PriceLevel, { where: { id } });

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ───── Pricing ─────

  async getEffectivePrice(itemId: string, priceLevelId: string): Promise<number> {
    // Verify item exists
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found`);
    }

    // Check for override
    const override = await this.itemPriceLevelRepo.findByItemAndLevel(itemId, priceLevelId);
    if (override) {
      return override.price;
    }

    // Fall back to base price
    return item.price;
  }

  async getPricingGrid(priceLevelId: string) {
    // Verify price level exists
    await this.findOne(priceLevelId);

    // Get all items
    const items = await this.itemRepo.find({
      where: { deletedAt: IsNull() },
      relations: { category: true },
      order: { name: 'ASC' },
    });

    // Get all overrides for this price level
    const overrides = await this.itemPriceLevelRepo.findByPriceLevel(priceLevelId);
    const overrideMap = new Map(overrides.map((o) => [o.itemId, o.price]));

    return items.map((item) => {
      const overridePrice = overrideMap.get(item.id) ?? null;
      const effectivePrice = overridePrice ?? item.price;
      return {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate,
        unit: item.unit?.code || item.unitId,
        categoryId: item.categoryId,
        categoryName: item.category?.name ?? null,
        basePrice: item.price,
        overridePrice,
        effectivePrice,
        isOverridden: overridePrice !== null,
      };
    });
  }

  async bulkUpsertItemPrices(priceLevelId: string, dto: BulkUpsertItemPriceDto): Promise<void> {
    // Verify price level exists
    await this.findOne(priceLevelId);

    await this.itemPriceLevelRepo.bulkUpsert(priceLevelId, dto.items);
  }
}
