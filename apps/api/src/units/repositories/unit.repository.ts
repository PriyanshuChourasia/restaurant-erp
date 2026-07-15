import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../entities/unit.entity';

@Injectable()
export class UnitRepository {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  async findAll(includeInactive = false): Promise<Unit[]> {
    const where: any = {};
    if (!includeInactive) where.isActive = true;
    return this.repo.find({ where, order: { unitType: 'ASC', name: 'ASC' } });
  }

  async findById(id: string): Promise<Unit | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Unit | null> {
    return this.repo.findOne({ where: { code } });
  }

  async findBaseUnit(unitType: string): Promise<Unit | null> {
    return this.repo.findOne({ where: { unitType: unitType as any, isBaseUnit: true } });
  }

  async create(data: Partial<Unit>): Promise<Unit> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Unit>): Promise<Unit> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
