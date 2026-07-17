import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
  ) {}

  async findAll(includeInactive = false): Promise<UnitOfMeasure[]> {
    const where: any = {};
    if (!includeInactive) where.isActive = true;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<UnitOfMeasure | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Find a unit by its symbol (e.g. 'kg', 'g', 'L', 'pcs') */
  async findByCode(symbol: string): Promise<UnitOfMeasure | null> {
    return this.repo.findOne({ where: { symbol } });
  }

  async create(data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
