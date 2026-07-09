import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { IRoleRepository } from '../interfaces/role-repository.interface';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  async create(data: Partial<Role>): Promise<Role> {
    const role = this.repo.create(data);
    return this.repo.save(role);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
