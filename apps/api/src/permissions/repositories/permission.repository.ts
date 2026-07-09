import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { IPermissionRepository } from '../interfaces/permission-repository.interface';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.repo.find({ order: { module: 'ASC', name: 'ASC' } });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findByModule(module: string): Promise<Permission[]> {
    return this.repo.find({ where: { module }, order: { name: 'ASC' } });
  }

  async create(data: Partial<Permission>): Promise<Permission> {
    const permission = this.repo.create(data);
    return this.repo.save(permission);
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.repo.find({ where: { id: In(ids) } });
  }
}
