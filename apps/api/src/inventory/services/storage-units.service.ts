import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StorageUnitRepository } from '../repositories/storage-unit.repository';
import { StorageUnit, StorageUnitType } from '../entities/storage-unit.entity';

@Injectable()
export class StorageUnitsService {
  constructor(
    private readonly repo: StorageUnitRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll(includeInactive = false): Promise<StorageUnit[]> {
    return this.repo.findAll(includeInactive);
  }

  async findById(id: string): Promise<StorageUnit> {
    const unit = await this.repo.findById(id);
    if (!unit) throw new NotFoundException(`Storage unit "${id}" not found`);
    return unit;
  }

  async findDefault(): Promise<StorageUnit> {
    return this.repo.findDefault();
  }

  async create(data: {
    name: string;
    code: string;
    type: StorageUnitType;
    isDefault?: boolean;
  }): Promise<StorageUnit> {
    if (data.isDefault) {
      await this.clearExistingDefault();
    }
    return this.repo.create({ ...data, isActive: true });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      type: StorageUnitType;
      isDefault: boolean;
      isActive: boolean;
    }>,
  ): Promise<StorageUnit> {
    await this.findById(id);

    if (data.isDefault === true) {
      await this.clearExistingDefault(id);
    }

    // Prevent deactivating the current default
    if (data.isActive === false) {
      const current = await this.repo.findById(id);
      if (current?.isDefault) {
        throw new BadRequestException(
          'Cannot deactivate the default storage unit. Set another unit as default first.',
        );
      }
    }

    return this.repo.update(id, data);
  }

  async setDefault(id: string): Promise<StorageUnit> {
    await this.findById(id);
    await this.clearExistingDefault(id);
    return this.repo.update(id, { isDefault: true });
  }

  async remove(id: string): Promise<void> {
    const unit = await this.findById(id);
    if (unit.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default storage unit. Set another unit as default first.',
      );
    }
    await this.repo.update(id, { isActive: false });
  }

  private async clearExistingDefault(excludeId?: string): Promise<void> {
    try {
      const currentDefault = await this.repo.findDefault();
      if (currentDefault.id !== excludeId) {
        await this.repo.update(currentDefault.id, { isDefault: false });
      }
    } catch {
      // No default exists — nothing to clear
    }
  }
}
