import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PermissionRepository } from '../repositories/permission.repository';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async findAll() {
    return this.permissionRepository.findAll();
  }

  async findOne(id: string) {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }
    return permission;
  }

  async create(dto: CreatePermissionDto) {
    const existing = await this.permissionRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Permission "${dto.name}" already exists`);
    }
    return this.permissionRepository.create(dto);
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.permissionRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Permission "${dto.name}" already exists`);
      }
    }
    return this.permissionRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.permissionRepository.remove(id);
  }
}
