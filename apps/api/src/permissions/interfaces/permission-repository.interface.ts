import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findByModule(module: string): Promise<Permission[]>;
  create(data: Partial<Permission>): Promise<Permission>;
  update(id: string, data: Partial<Permission>): Promise<Permission>;
  remove(id: string): Promise<void>;
  findByIds(ids: string[]): Promise<Permission[]>;
}
