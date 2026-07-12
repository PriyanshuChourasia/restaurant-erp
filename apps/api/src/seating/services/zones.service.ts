import { Injectable, NotFoundException } from '@nestjs/common';
import { ZoneRepository } from '../repositories/zone.repository';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { Zone } from '../entities/zone.entity';

@Injectable()
export class ZonesService {
  constructor(private readonly zoneRepo: ZoneRepository) {}

  async findAll(includeInactive = false) {
    return this.zoneRepo.findAll(includeInactive);
  }

  async findOne(id: string): Promise<Zone> {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) throw new NotFoundException(`Zone with ID "${id}" not found`);
    return zone;
  }

  async create(dto: CreateZoneDto): Promise<Zone> {
    return this.zoneRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
    });
  }

  async update(id: string, dto: UpdateZoneDto): Promise<Zone> {
    await this.findOne(id);
    return this.zoneRepo.update(id, dto as any);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.zoneRepo.softDelete(id);
  }
}
