import { CategoryEntity } from '../entities/category.entity';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string | null;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult {
  items: CategoryEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICategoryRepository {
  findAll(options: FindAllOptions): Promise<PaginatedResult>;
  findById(id: string): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  findChildren(parentId: string): Promise<CategoryEntity[]>;
  findDescendants(
    parentId: string,
    parentPath: string,
  ): Promise<CategoryEntity[]>;
  findAncestors(path: string): Promise<CategoryEntity[]>;
  findTree(includeDeleted?: boolean): Promise<CategoryEntity[]>;
  findRoots(
    options?: Omit<FindAllOptions, 'parentId'>,
  ): Promise<PaginatedResult>;
  findByNameAndParent(
    name: string,
    parentId: string | null,
  ): Promise<CategoryEntity | null>;
  hasChildren(id: string): Promise<boolean>;
  countChildren(id: string): Promise<number>;
  create(data: Partial<CategoryEntity>): Promise<CategoryEntity>;
  update(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity>;
  softDelete(id: string, deletedBy?: string | null): Promise<void>;
  restore(id: string): Promise<CategoryEntity>;
  updateDescendantPaths(oldPrefix: string, newPrefix: string): Promise<void>;
}
