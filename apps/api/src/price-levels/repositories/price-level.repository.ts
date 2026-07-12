import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Brackets } from 'typeorm';
import { PriceLevel } from '../entities/price-level.entity';
import type { IPriceLevelRepository, PaginatedPriceLevelResult } from '../interfaces/price-level-repository.interface';
import { QueryPriceLevelDto } from '../dto/query-price-level.dto';

@Injectable()
export class PriceLevelRepository implements IPriceLevelRepository {
  constructor(
    @InjectRepository(PriceLevel)
    private readonly repo: Repository<PriceLevel>,
  ) {}

  async findAll(query: QueryPriceLevelDto): Promise<PaginatedPriceLevelResult> {
    const { page = 1, limit = 20, search, isActive } = query;

    const qb = this.repo.createQueryBuilder('pl')
      .where('pl.deletedAt IS NULL');

    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub.where('pl.name ILIKE :search', { search: `%${search}%` })
            .orWhere('pl.code ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (isActive !== undefined) {
      qb.andWhere('pl.isActive = :isActive', { isActive });
    }

    qb.orderBy('pl.name', 'ASC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PriceLevel | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  async findByCode(code: string): Promise<PriceLevel | null> {
    return this.repo.findOne({
      where: { code },
      withDeleted: true,
    });
  }

  async findDefault(): Promise<PriceLevel | null> {
    return this.repo.findOne({
      where: { isDefault: true, isActive: true, deletedAt: IsNull() },
    });
  }

  async findAllActive(): Promise<PriceLevel[]> {
    return this.repo.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async create(data: Partial<PriceLevel>): Promise<PriceLevel> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<PriceLevel>): Promise<PriceLevel> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
