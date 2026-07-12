import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Table } from '../entities/table.entity';

@Injectable()
export class TableRepository {
  constructor(
    @InjectRepository(Table)
    private readonly repo: Repository<Table>,
  ) {}

  async findByZone(zoneId: string): Promise<Table[]> {
    return this.repo.find({
      where: { zoneId, deletedAt: IsNull() },
      order: { label: 'ASC' },
    });
  }

  async findUnassigned(): Promise<Table[]> {
    return this.repo.find({
      where: { zoneId: IsNull(), deletedAt: IsNull() },
      order: { label: 'ASC' },
    });
  }

  async findById(id: string): Promise<Table | null> {
    return this.repo.findOne({
      where: { id },
      relations: { zone: true },
      withDeleted: true,
    });
  }

  async findByIds(ids: string[]): Promise<Table[]> {
    return this.repo.find({
      where: { id: ids as any, deletedAt: IsNull() },
    });
  }

  async findAll(zoneId?: string, unassigned?: boolean): Promise<Table[]> {
    const where: any = { deletedAt: IsNull() };

    if (unassigned) {
      where.zoneId = IsNull();
    } else if (zoneId) {
      where.zoneId = zoneId;
    }

    return this.repo.find({
      where,
      relations: { zone: true },
      order: { label: 'ASC' },
    });
  }

  async create(data: Partial<Table>): Promise<Table> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Table>): Promise<Table> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { zone: true },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }

  async updatePosition(id: string, posX: number, posY: number): Promise<void> {
    await this.repo.update(id, { posX, posY });
  }

  async assignToZone(id: string, zoneId: string | null): Promise<void> {
    await this.repo.update(id, { zoneId });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
