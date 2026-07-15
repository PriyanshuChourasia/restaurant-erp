import { Injectable, NotFoundException } from '@nestjs/common';
import { TableRepository } from '../repositories/table.repository';
import { CreateTableDto } from '../dto/create-table.dto';
import { UpdateTableDto } from '../dto/update-table.dto';
import { Table } from '../entities/table.entity';

@Injectable()
export class TablesService {
  constructor(private readonly tableRepo: TableRepository) {}

  async findByZone(zoneId: string) {
    return this.tableRepo.findByZone(zoneId);
  }

  async findAll(zoneId?: string, unassigned?: boolean) {
    return this.tableRepo.findAll(zoneId, unassigned);
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableRepo.findById(id);
    if (!table) throw new NotFoundException(`Table with ID "${id}" not found`);
    return table;
  }

  async create(dto: CreateTableDto): Promise<Table> {
    return this.tableRepo.create({
      zoneId: dto.zoneId ?? null,
      label: dto.label,
      capacity: dto.capacity ?? null,
      category: dto.category ?? 'walk_in',
      status: dto.status ?? 'available',
      posX: dto.posX ?? null,
      posY: dto.posY ?? null,
      isActive: dto.isActive ?? true,
    });
  }

  async update(id: string, dto: UpdateTableDto): Promise<Table> {
    await this.findOne(id);
    return this.tableRepo.update(id, dto as any);
  }

  async updateStatus(id: string, status: string): Promise<Table> {
    const table = await this.findOne(id);
    await this.tableRepo.updateStatus(id, status);
    return { ...table, status };
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    for (const id of ids) {
      await this.tableRepo.updateStatus(id, status);
    }
  }

  async assignToZone(id: string, zoneId: string | null): Promise<Table> {
    const table = await this.findOne(id);
    await this.tableRepo.assignToZone(id, zoneId);
    return { ...table, zoneId };
  }

  async updatePosition(id: string, posX: number, posY: number): Promise<Table> {
    const table = await this.findOne(id);
    await this.tableRepo.updatePosition(id, posX, posY);
    return { ...table, posX, posY };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tableRepo.softDelete(id);
  }

  async getSummary(): Promise<{ totalTables: number; activeTables: number; occupiedTables: number }> {
    const all = await this.tableRepo.findAll();
    return {
      totalTables: all.length,
      activeTables: all.filter((t) => t.status === 'occupied').length,
      occupiedTables: all.filter((t) => t.status === 'occupied').length,
    };
  }
}
