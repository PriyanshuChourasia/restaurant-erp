import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../../permissions/repositories/permission.repository';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async findAll() {
    return this.roleRepository.findAll();
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.roleRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    const permissions = dto.permissionIds?.length
      ? await this.permissionRepository.findByIds(dto.permissionIds)
      : [];

    return this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      permissions,
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
    }

    const permissions = dto.permissionIds?.length
      ? await this.permissionRepository.findByIds(dto.permissionIds)
      : undefined;

    const updateData: Partial<typeof role> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (permissions !== undefined) updateData.permissions = permissions;

    return this.roleRepository.update(id, updateData);
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.roleRepository.remove(id);
  }
}
