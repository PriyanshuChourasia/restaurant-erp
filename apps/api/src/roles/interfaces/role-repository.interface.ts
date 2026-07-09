import { Role } from '../entities/role.entity';

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: Partial<Role>): Promise<Role>;
  update(id: string, data: Partial<Role>): Promise<Role>;
  remove(id: string): Promise<void>;
}
