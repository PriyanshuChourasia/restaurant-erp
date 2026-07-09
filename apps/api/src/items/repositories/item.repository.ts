import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Brackets } from 'typeorm';
import { Item } from '../entities/item.entity';
import type { IItemRepository } from '../interfaces/item-repository.interface';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(
    @InjectRepository(Item)
    private readonly repo: Repository<Item>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    isVeg?: boolean;
  }): Promise<{ items: Item[]; total: number }> {
    const { page = 1, limit = 20, search, categoryId, isActive, isVeg } = params;
    const query = this.repo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.deletedAt IS NULL');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('item.name ILIKE :search', { search: `%${search}%` })
            .orWhere('item.sku ILIKE :search', { search: `%${search}%` })
            .orWhere('item.hsnCode ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (categoryId) {
      query.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      query.andWhere('item.isActive = :isActive', { isActive });
    }

    if (isVeg !== undefined) {
      query.andWhere('item.isVeg = :isVeg', { isVeg });
    }

    query.orderBy('item.name', 'ASC');

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<Item | null> {
    return this.repo.findOne({
      where: { id },
      relations: { category: true },
    });
  }

  async findBySku(sku: string): Promise<Item | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async findByCategory(categoryId: string): Promise<Item[]> {
    return this.repo.find({
      where: { categoryId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async create(data: Partial<Item>): Promise<Item> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Item>): Promise<Item> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id }, relations: { category: true } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
