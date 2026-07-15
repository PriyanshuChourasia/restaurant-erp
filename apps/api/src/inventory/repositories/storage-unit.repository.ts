import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageUnit } from '../entities/storage-unit.entity';

@Injectable()
export class StorageUnitRepository {
  constructor(
    @InjectRepository(StorageUnit)
    private readonly repo: Repository<StorageUnit>,
  ) {}

  async findAll(includeInactive = false): Promise<StorageUnit[]> {
    const where: any = {};
    if (!includeInactive) where.isActive = true;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<StorageUnit | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findDefault(): Promise<StorageUnit> {
    const unit = await this.repo.findOne({ where: { isDefault: true } });
    if (!unit) {
      throw new InternalServerErrorException(
        'No default storage unit found. Seed data may be missing.',
      );
    }
    return unit;
  }

  async create(data: Partial<StorageUnit>): Promise<StorageUnit> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<StorageUnit>): Promise<StorageUnit> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
