import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Zone } from '../entities/zone.entity';

@Injectable()
export class ZoneRepository {
  constructor(
    @InjectRepository(Zone)
    private readonly repo: Repository<Zone>,
  ) {}

  async findAll(includeInactive = false): Promise<Zone[]> {
    const where: any = { deletedAt: IsNull() };
    if (!includeInactive) where.isActive = true;
    return this.repo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Zone | null> {
    return this.repo.findOne({ where: { id }, withDeleted: true });
  }

  async create(data: Partial<Zone>): Promise<Zone> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Zone>): Promise<Zone> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
