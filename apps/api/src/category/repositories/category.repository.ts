import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like, In, FindOptionsWhere } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import {
  ICategoryRepository,
  FindAllOptions,
  PaginatedResult,
} from '../interfaces/category-repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
  ) {}

  async findAll(options: FindAllOptions): Promise<PaginatedResult> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      parentId,
      includeDeleted = false,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
    } = options;

    const where: FindOptionsWhere<CategoryEntity> = {};

    if (!includeDeleted) {
      where.deletedAt = IsNull();
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === null ? IsNull() : parentId;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [entities, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: includeDeleted,
    });

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    return this.repo.findOne({
      where: { slug },
      withDeleted: true,
    });
  }

  async findChildren(parentId: string): Promise<CategoryEntity[]> {
    return this.repo.find({
      where: { parentId, deletedAt: IsNull() },
      order: { displayOrder: 'ASC' },
    });
  }

  async findDescendants(
    parentId: string,
    parentPath: string,
  ): Promise<CategoryEntity[]> {
    return this.repo.find({
      where: [
        { path: Like(`${parentPath}${parentId}/%`), deletedAt: IsNull() },
      ],
      order: { level: 'ASC', displayOrder: 'ASC' },
    });
  }

  async findAncestors(path: string): Promise<CategoryEntity[]> {
    if (!path) return [];
    const ancestorIds = path.split('/').filter(Boolean);
    if (ancestorIds.length === 0) return [];

    const entities = await this.repo.find({
      where: { id: In(ancestorIds) },
      withDeleted: true,
    });

    // Reorder to match path order (root first)
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    return ancestorIds
      .map((id) => entityMap.get(id))
      .filter((e): e is CategoryEntity => !!e);
  }

  async findTree(includeDeleted = false): Promise<CategoryEntity[]> {
    return this.repo.find({
      where: includeDeleted ? {} : { deletedAt: IsNull() },
      order: { path: 'ASC', displayOrder: 'ASC' },
      withDeleted: includeDeleted,
    });
  }

  async findRoots(
    options?: Omit<FindAllOptions, 'parentId'>,
  ): Promise<PaginatedResult> {
    return this.findAll({
      ...(options || {}),
      parentId: null,
    });
  }

  async findByNameAndParent(
    name: string,
    parentId: string | null,
  ): Promise<CategoryEntity | null> {
    const where: FindOptionsWhere<CategoryEntity> = {
      name,
      deletedAt: IsNull(),
    };

    if (parentId === null) {
      where.parentId = IsNull();
    } else {
      where.parentId = parentId;
    }

    return this.repo.findOne({ where });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { parentId: id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async countChildren(id: string): Promise<number> {
    return this.repo.count({
      where: { parentId: id, deletedAt: IsNull() },
    });
  }

  async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<CategoryEntity>,
  ): Promise<CategoryEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string, deletedBy?: string | null): Promise<void> {
    await this.repo.update(id, {
      deletedAt: new Date(),
      deletedBy: deletedBy ?? null,
    });
  }

  async restore(id: string): Promise<CategoryEntity> {
    await this.repo.restore(id);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async updateDescendantPaths(
    oldPrefix: string,
    newPrefix: string,
  ): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({
        path: () => `REPLACE(path, :oldPrefix, :newPrefix)`,
      })
      .where(`path LIKE :pattern`, {
        pattern: `${oldPrefix}%`,
        oldPrefix,
        newPrefix,
      })
      .execute();
  }
}
