import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { MoveCategoryDto } from '../dto/move-category.dto';
import { SearchQueryDto } from '../dto/search-query.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { TreeCategoryDto, TreeResponseDto } from '../dto/tree-response.dto';
import {
  BreadcrumbItemDto,
  BreadcrumbResponseDto,
} from '../dto/breadcrumb-response.dto';

const DEFAULT_MAX_DEPTH = 10;

@Injectable()
export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  // ---- Create ----

  async create(
    dto: CreateCategoryDto,
    userId?: string,
    maxDepth: number = DEFAULT_MAX_DEPTH,
  ): Promise<CategoryResponseDto> {
    // Validate slug format (alphanumeric + hyphens)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dto.slug)) {
      throw new BadRequestException(
        'Slug must contain only lowercase alphanumeric characters and hyphens',
      );
    }

    // Check unique slug
    const existingBySlug = await this.repository.findBySlug(dto.slug);
    if (existingBySlug) {
      throw new ConflictException(
        `Category with slug '${dto.slug}' already exists`,
      );
    }

    // Validate display order
    if (dto.displayOrder !== undefined && dto.displayOrder < 0) {
      throw new BadRequestException('Display order cannot be negative');
    }

    // Resolve parent
    let parentId: string | null = null;
    let path = '';
    let level = 0;

    if (dto.parentId) {
      const parent = await this.repository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          `Parent category '${dto.parentId}' not found`,
        );
      }
      if (parent.deletedAt) {
        throw new BadRequestException(
          'Cannot create a category under a deleted parent',
        );
      }

      // Check max depth
      if (parent.level + 1 > maxDepth) {
        throw new BadRequestException(
          `Maximum hierarchy depth of ${maxDepth} exceeded`,
        );
      }

      parentId = parent.id;
      path = `${parent.path}${parent.id}/`;
      level = parent.level + 1;
    }

    // Check unique name under parent
    const existingByName = await this.repository.findByNameAndParent(
      dto.name,
      parentId,
    );
    if (existingByName) {
      throw new ConflictException(
        `Category with name '${dto.name}' already exists under this parent`,
      );
    }

    const entity = await this.repository.create({
      id: uuidv4(),
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
      parentId,
      path,
      level,
      icon: dto.icon ?? null,
      image: dto.image ?? null,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });

    return this.toResponse(entity);
  }

  // ---- Read ----

  async findAll(query: SearchQueryDto) {
    const result = await this.repository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      parentId: query.parentId,
      includeDeleted: query.includeDeleted,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const items = await Promise.all(
      result.items.map(async (cat) => {
        const count = await this.repository.countChildren(cat.id);
        return { ...this.toResponse(cat), childrenCount: count };
      }),
    );

    return { ...result, items };
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    const childrenCount = await this.repository.countChildren(id);
    return { ...this.toResponse(category), childrenCount };
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.repository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    const childrenCount = await this.repository.countChildren(category.id);
    return { ...this.toResponse(category), childrenCount };
  }

  async getTree(): Promise<TreeResponseDto> {
    const allCategories = await this.repository.findTree();
    const tree = this.buildTree(allCategories);
    return { items: tree };
  }

  async getBreadcrumb(id: string): Promise<BreadcrumbResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    const ancestors = await this.repository.findAncestors(category.path);
    const items: BreadcrumbItemDto[] = [
      ...ancestors.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        level: a.level,
      })),
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
      },
    ];
    return { items };
  }

  async getChildren(id: string): Promise<CategoryResponseDto[]> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    const children = await this.repository.findChildren(id);
    return Promise.all(
      children.map(async (child) => {
        const count = await this.repository.countChildren(child.id);
        return { ...this.toResponse(child), childrenCount: count };
      }),
    );
  }

  async getDescendants(id: string): Promise<CategoryResponseDto[]> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    const descendants = await this.repository.findDescendants(
      id,
      category.path,
    );
    return Promise.all(
      descendants.map(async (d) => {
        const count = await this.repository.countChildren(d.id);
        return { ...this.toResponse(d), childrenCount: count };
      }),
    );
  }

  async getAncestors(id: string): Promise<BreadcrumbItemDto[]> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    const ancestors = await this.repository.findAncestors(category.path);
    return ancestors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      level: a.level,
    }));
  }

  async getRoots(query: SearchQueryDto) {
    const result = await this.repository.findRoots({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      includeDeleted: query.includeDeleted,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const items = await Promise.all(
      result.items.map(async (cat) => {
        const count = await this.repository.countChildren(cat.id);
        return { ...this.toResponse(cat), childrenCount: count };
      }),
    );

    return { ...result, items };
  }

  // ---- Update ----

  async update(
    id: string,
    dto: UpdateCategoryDto,
    userId?: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (category.deletedAt) {
      throw new BadRequestException('Cannot update a deleted category');
    }

    const updateData: Partial<CategoryEntity> = { updatedBy: userId ?? null };

    // Check slug uniqueness if changed
    if (dto.slug && dto.slug !== category.slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dto.slug)) {
        throw new BadRequestException(
          'Slug must contain only lowercase alphanumeric characters and hyphens',
        );
      }
      const existingBySlug = await this.repository.findBySlug(dto.slug);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          `Category with slug '${dto.slug}' already exists`,
        );
      }
      updateData.slug = dto.slug;
    }

    // Check name uniqueness under parent if changed
    if (dto.name && dto.name !== category.name) {
      const existingByName = await this.repository.findByNameAndParent(
        dto.name,
        category.parentId,
      );
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          `Category with name '${dto.name}' already exists under this parent`,
        );
      }
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.displayOrder !== undefined) {
      if (dto.displayOrder < 0) {
        throw new BadRequestException('Display order cannot be negative');
      }
      updateData.displayOrder = dto.displayOrder;
    }
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
  }

  // ---- Move ----

  async move(
    id: string,
    dto: MoveCategoryDto,
    userId?: string,
    maxDepth: number = DEFAULT_MAX_DEPTH,
  ): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (category.deletedAt) {
      throw new BadRequestException('Cannot move a deleted category');
    }

    const newParentId = dto.parentId ?? null;

    // No change
    if (newParentId === category.parentId) {
      return this.toResponse(category);
    }

    // Prevent self-reference
    if (newParentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    let newPath: string;
    let newLevel: number;

    if (newParentId === null) {
      // Moving to root
      newPath = '';
      newLevel = 0;
    } else {
      const newParent = await this.repository.findById(newParentId);
      if (!newParent) {
        throw new NotFoundException(
          `Parent category '${newParentId}' not found`,
        );
      }
      if (newParent.deletedAt) {
        throw new BadRequestException('Cannot move under a deleted category');
      }

      // Check circular reference
      const ancestors = await this.repository.findAncestors(newParent.path);
      if (ancestors.some((a) => a.id === id)) {
        throw new BadRequestException(
          'Cannot move a category into one of its own descendants',
        );
      }

      // Check max depth
      if (newParent.level + 1 > maxDepth) {
        throw new BadRequestException(
          `Maximum hierarchy depth of ${maxDepth} exceeded`,
        );
      }

      newPath = `${newParent.path}${newParent.id}/`;
      newLevel = newParent.level + 1;
    }

    // Update all descendant paths
    const oldPrefix = `${category.path}${category.id}/`;
    const newPrefix = newPath;

    // Get descendants before moving
    const descendants = await this.repository.findDescendants(
      id,
      category.path,
    );
    const descendantIds = descendants.map((d) => d.id);

    // Update the category itself
    await this.repository.update(id, {
      parentId: newParentId,
      path: newPath,
      level: newLevel,
      updatedBy: userId ?? null,
    });

    // Update descendant paths
    if (descendantIds.length > 0) {
      await this.repository.updateDescendantPaths(oldPrefix, newPrefix);
      // Update levels for all descendants
      const levelDiff = newLevel - category.level;
      for (const descId of descendantIds) {
        const desc = descendants.find((d) => d.id === descId);
        if (desc) {
          await this.repository.update(descId, {
            level: desc.level + levelDiff,
          });
        }
      }
    }

    const updated = await this.repository.findById(id);
    return this.toResponse(updated!);
  }

  // ---- Delete ----

  async remove(id: string, force = false, userId?: string): Promise<void> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (category.deletedAt) {
      throw new BadRequestException('Category is already deleted');
    }

    const hasChildren = await this.repository.hasChildren(id);

    if (hasChildren) {
      if (force) {
        // Soft-delete all descendants
        const descendants = await this.repository.findDescendants(
          id,
          category.path,
        );
        for (const child of descendants) {
          await this.repository.softDelete(child.id, userId);
        }
      } else {
        throw new BadRequestException(
          'Cannot delete category with children. Set force=true to delete all descendants.',
        );
      }
    }

    await this.repository.softDelete(id, userId);
  }

  async restore(id: string, userId?: string): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (!category.deletedAt) {
      throw new BadRequestException('Category is not deleted');
    }

    const restored = await this.repository.restore(id);
    await this.repository.update(id, { updatedBy: userId ?? null });
    return this.toResponse(restored);
  }

  // ---- Activate / Deactivate ----

  async activate(id: string, userId?: string): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (category.deletedAt) {
      throw new BadRequestException('Cannot activate a deleted category');
    }

    const updated = await this.repository.update(id, {
      isActive: true,
      updatedBy: userId ?? null,
    });
    return this.toResponse(updated);
  }

  async deactivate(id: string, userId?: string): Promise<CategoryResponseDto> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }
    if (category.deletedAt) {
      throw new BadRequestException('Cannot deactivate a deleted category');
    }

    const updated = await this.repository.update(id, {
      isActive: false,
      updatedBy: userId ?? null,
    });
    return this.toResponse(updated);
  }

  // ---- Helpers ----

  private toResponse(entity: CategoryEntity): CategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      parentId: entity.parentId,
      path: entity.path,
      level: entity.level,
      icon: entity.icon,
      image: entity.image,
      childrenCount: 0,
      version: entity.version,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private buildTree(categories: CategoryEntity[]): TreeCategoryDto[] {
    const map = new Map<string, TreeCategoryDto>();
    const roots: TreeCategoryDto[] = [];

    // Create nodes
    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        parentId: cat.parentId,
        path: cat.path,
        level: cat.level,
        icon: cat.icon,
        image: cat.image,
        children: [],
      });
    }

    // Build hierarchy
    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort children by displayOrder
    const sortChildren = (nodes: TreeCategoryDto[]) => {
      nodes.sort((a, b) => a.displayOrder - b.displayOrder);
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };
    sortChildren(roots);

    return roots;
  }
}
