import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Brackets } from 'typeorm';
import { StockItem } from '../entities/stock-item.entity';
import type { IStockItemRepository } from '../interfaces/stock-item-repository.interface';

@Injectable()
export class StockItemRepository implements IStockItemRepository {
  constructor(
    @InjectRepository(StockItem)
    private readonly repo: Repository<StockItem>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    group?: string;
    stockCategoryId?: string;
    isActive?: boolean;
    isVeg?: boolean;
  }): Promise<{ items: StockItem[]; total: number }> {
    const { page = 1, limit = 20, search, categoryId, group, stockCategoryId, isActive, isVeg } = params;
    const query = this.repo.createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.category', 'category')
      .leftJoinAndSelect('stockItem.stockGroup', 'stockGroup')
      .leftJoinAndSelect('stockItem.stockCategory', 'stockCategory')
      .leftJoinAndSelect('stockItem.unit', 'unit')
      .where('stockItem.deletedAt IS NULL');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('stockItem.name ILIKE :search', { search: `%${search}%` })
            .orWhere('stockItem.sku ILIKE :search', { search: `%${search}%` })
            .orWhere('stockItem.hsnCode ILIKE :search', { search: `%${search}%` })
            .orWhere('stockItem.barcode ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (categoryId) {
      query.andWhere('stockItem.categoryId = :categoryId', { categoryId });
    }

    if (group) {
      query.andWhere('stockGroup.code = :group', { group });
    }

    if (stockCategoryId) {
      query.andWhere('stockItem.stockCategoryId = :stockCategoryId', { stockCategoryId });
    }

    if (isActive !== undefined) {
      query.andWhere('stockItem.isActive = :isActive', { isActive });
    }

    if (isVeg !== undefined) {
      query.andWhere('stockItem.isVeg = :isVeg', { isVeg });
    }

    query.orderBy('stockItem.name', 'ASC');

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<StockItem | null> {
    return this.repo.findOne({
      where: { id },
      relations: { category: true, stockGroup: true, stockCategory: true, unit: true, purchaseUnit: true },
    });
  }

  async findBySku(sku: string): Promise<StockItem | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async findByCategory(categoryId: string): Promise<StockItem[]> {
    return this.repo.find({
      where: { categoryId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async create(data: Partial<StockItem>): Promise<StockItem> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<StockItem>): Promise<StockItem> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { category: true, stockGroup: true, stockCategory: true, unit: true, purchaseUnit: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
