import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryEntity } from '../entities/category.entity';

// uuid v9+ is ESM-only and Jest can't handle it — mock it.
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;

  const baseCategory: CategoryEntity = {
    id: 'cat-1',
    name: 'Beverages',
    slug: 'beverages',
    description: 'Drinks and beverages',
    displayOrder: 0,
    isActive: true,
    parentId: null,
    parent: null,
    path: '',
    level: 0,
    icon: null,
    image: null,
    version: 1,
    createdBy: 'user-1',
    updatedBy: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const childCategory: CategoryEntity = {
    ...baseCategory,
    id: 'cat-2',
    name: 'Soft Drinks',
    slug: 'soft-drinks',
    parentId: 'cat-1',
    path: 'cat-1/',
    level: 1,
  };

  const grandchildCategory: CategoryEntity = {
    ...baseCategory,
    id: 'cat-3',
    name: 'Cola',
    slug: 'cola',
    parentId: 'cat-2',
    path: 'cat-1/cat-2/',
    level: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findByNameAndParent: jest.fn(),
            findAll: jest.fn(),
            findChildren: jest.fn(),
            findDescendants: jest.fn(),
            findAncestors: jest.fn(),
            findTree: jest.fn(),
            findRoots: jest.fn(),
            hasChildren: jest.fn(),
            countChildren: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            updateDescendantPaths: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(CategoryRepository) as jest.Mocked<CategoryRepository>;
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      name: 'Beverages',
      slug: 'beverages',
      description: 'Drinks',
      displayOrder: 1,
      isActive: true,
    };

    it('should create a root category', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findByNameAndParent.mockResolvedValue(null);
      repository.create.mockResolvedValue(baseCategory);

      const result = await service.create(createDto, 'user-1');

      expect(result.name).toBe('Beverages');
      expect(result.slug).toBe('beverages');
      expect(result.level).toBe(0);
      expect(result.path).toBe('');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Beverages',
          slug: 'beverages',
          parentId: null,
          level: 0,
          path: '',
          displayOrder: 1,
        }),
      );
    });

    it('should create a child category', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findByNameAndParent.mockResolvedValue(null);
      repository.findById.mockResolvedValue(baseCategory);
      repository.create.mockResolvedValue(childCategory);

      const result = await service.create({ ...createDto, slug: 'soft-drinks', name: 'Soft Drinks', parentId: 'cat-1' }, 'user-1');

      expect(result.name).toBe('Soft Drinks');
      expect(result.level).toBe(1);
      expect(result.path).toBe('cat-1/');
    });

    it('should throw BadRequestException for invalid slug format', async () => {
      await expect(
        service.create({ ...createDto, slug: 'Invalid Slug!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate slug', async () => {
      repository.findBySlug.mockResolvedValue(baseCategory);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent is not found', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findById.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when parent is deleted', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(
        service.create({ ...createDto, parentId: 'cat-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max depth exceeded', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findById.mockResolvedValue({ ...baseCategory, level: 10 } as CategoryEntity);

      await expect(
        service.create({ ...createDto, parentId: 'cat-1' }, 'user-1', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate name under same parent', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findByNameAndParent.mockResolvedValue(baseCategory);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for negative display order', async () => {
      repository.findBySlug.mockResolvedValue(null);
      repository.findByNameAndParent.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, displayOrder: -1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ───── findOne ─────

  describe('findOne', () => {
    it('should return a category with children count', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.countChildren.mockResolvedValue(2);

      const result = await service.findOne('cat-1');

      expect(result.id).toBe('cat-1');
      expect(result.childrenCount).toBe(2);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── findBySlug ─────

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      repository.findBySlug.mockResolvedValue(baseCategory);
      repository.countChildren.mockResolvedValue(0);

      const result = await service.findBySlug('beverages');

      expect(result.slug).toBe('beverages');
    });

    it('should throw NotFoundException when slug not found', async () => {
      repository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── getTree ─────

  describe('getTree', () => {
    it('should build a tree from flat categories', async () => {
      repository.findTree.mockResolvedValue([
        baseCategory,
        childCategory,
        grandchildCategory,
      ]);

      const result = await service.getTree();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Beverages');
      expect(result.items[0].children).toHaveLength(1);
      expect(result.items[0].children[0].name).toBe('Soft Drinks');
      expect(result.items[0].children[0].children).toHaveLength(1);
      expect(result.items[0].children[0].children[0].name).toBe('Cola');
    });

    it('should sort children by displayOrder', async () => {
      const catA = { ...baseCategory, id: 'a', name: 'A', displayOrder: 2 };
      const catB = { ...baseCategory, id: 'b', name: 'B', displayOrder: 1 };
      const catC = { ...baseCategory, id: 'c', name: 'C', displayOrder: 0 };
      repository.findTree.mockResolvedValue([catA, catB, catC]);

      const result = await service.getTree();

      expect(result.items[0].name).toBe('C');
      expect(result.items[1].name).toBe('B');
      expect(result.items[2].name).toBe('A');
    });
  });

  // ───── getBreadcrumb ─────

  describe('getBreadcrumb', () => {
    it('should return breadcrumb with ancestors', async () => {
      repository.findById.mockResolvedValue(grandchildCategory);
      repository.findAncestors.mockResolvedValue([baseCategory, childCategory]);

      const result = await service.getBreadcrumb('cat-3');

      expect(result.items).toHaveLength(3);
      expect(result.items[0].name).toBe('Beverages');
      expect(result.items[1].name).toBe('Soft Drinks');
      expect(result.items[2].name).toBe('Cola');
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getBreadcrumb('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── getChildren ─────

  describe('getChildren', () => {
    it('should return direct children with children count', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.findChildren.mockResolvedValue([childCategory]);
      repository.countChildren.mockResolvedValue(0);

      const result = await service.getChildren('cat-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Soft Drinks');
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getChildren('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── getDescendants ─────

  describe('getDescendants', () => {
    it('should return all descendants with children count', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.findDescendants.mockResolvedValue([childCategory, grandchildCategory]);
      repository.countChildren.mockResolvedValue(0);

      const result = await service.getDescendants('cat-1');

      expect(result).toHaveLength(2);
    });
  });

  // ───── getAncestors ─────

  describe('getAncestors', () => {
    it('should return ancestors as breadcrumb items', async () => {
      repository.findById.mockResolvedValue(grandchildCategory);
      repository.findAncestors.mockResolvedValue([baseCategory, childCategory]);

      const result = await service.getAncestors('cat-3');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Beverages');
      expect(result[0].slug).toBe('beverages');
    });
  });

  // ───── update ─────

  describe('update', () => {
    it('should update a category', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.update.mockResolvedValue({
        ...baseCategory,
        name: 'Updated Beverages',
        description: 'Updated desc',
      } as CategoryEntity);

      const result = await service.update('cat-1', {
        name: 'Updated Beverages',
        description: 'Updated desc',
      }, 'user-1');

      expect(result.name).toBe('Updated Beverages');
      expect(result.description).toBe('Updated desc');
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating a deleted category', async () => {
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(service.update('cat-1', { name: 'X' })).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate slug', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.findBySlug.mockResolvedValue({ ...baseCategory, id: 'other-cat' } as CategoryEntity);

      await expect(service.update('cat-1', { slug: 'taken-slug' })).rejects.toThrow(ConflictException);
    });

    it('should allow updating with own slug (no conflict)', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.findBySlug.mockResolvedValue(baseCategory);
      repository.update.mockResolvedValue({ ...baseCategory, slug: 'beverages' } as CategoryEntity);

      const result = await service.update('cat-1', { slug: 'beverages' });

      expect(result.slug).toBe('beverages');
    });
  });

  // ───── move ─────

  describe('move', () => {
    it('should move a category to a new parent and update descendant paths', async () => {
      const newParent: CategoryEntity = {
        ...baseCategory,
        id: 'parent-2',
        name: 'All Items',
        path: '',
        level: 0,
      };
      const findByIdMock = jest.fn()
        .mockResolvedValueOnce(baseCategory)           // call 1: fetch cat-1
        .mockResolvedValueOnce(newParent)               // call 2: fetch new parent
        .mockResolvedValue({                            // call 3+: fetch updated
          ...baseCategory,
          parentId: 'parent-2',
          path: 'parent-2/',
          level: 1,
        } as CategoryEntity);
      repository.findById = findByIdMock as any;
      repository.findAncestors.mockResolvedValue([]);
      repository.findDescendants.mockResolvedValue([childCategory]);

      const result = await service.move('cat-1', { parentId: 'parent-2' });

      expect(result.level).toBe(1);
      expect(repository.updateDescendantPaths).toHaveBeenCalledWith('cat-1/', 'parent-2/');
    });

    it('should move a category to root', async () => {
      const updated = {
        ...childCategory,
        parentId: null,
        path: '',
        level: 0,
      } as CategoryEntity;
      const findByIdMock = jest.fn()
        .mockResolvedValueOnce(childCategory)  // call 1: fetch original
        .mockResolvedValue(updated);            // call 2+: fetch updated
      repository.findById = findByIdMock as any;
      repository.findDescendants.mockResolvedValue([]);

      const result = await service.move('cat-2', { parentId: null });

      expect(result.level).toBe(0);
      expect(result.path).toBe('');
      expect(repository.update).toHaveBeenCalledWith(
        'cat-2',
        expect.objectContaining({ parentId: null, path: '', level: 0 }),
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.move('nonexistent', { parentId: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when moving a deleted category', async () => {
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(service.move('cat-1', { parentId: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when setting self as parent', async () => {
      repository.findById.mockResolvedValue(baseCategory);

      await expect(service.move('cat-1', { parentId: 'cat-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for circular reference', async () => {
      const findByIdMock = jest.fn()
        .mockResolvedValueOnce(childCategory)        // call 1: fetch cat-2
        .mockResolvedValueOnce(grandchildCategory)    // call 2: fetch intended new parent (cat-3)
        .mockResolvedValue(null);                     // fallback
      repository.findById = findByIdMock as any;
      repository.findAncestors.mockResolvedValue([baseCategory, childCategory]);

      await expect(
        service.move('cat-2', { parentId: 'cat-3' }, undefined, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the category unchanged when parentId is the same', async () => {
      repository.findById.mockResolvedValue(baseCategory);

      const result = await service.move('cat-1', { parentId: null });

      expect(result.id).toBe('cat-1');
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // ───── remove ─────

  describe('remove', () => {
    it('should soft-delete a category without children', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.hasChildren.mockResolvedValue(false);

      await service.remove('cat-1', false, 'user-1');

      expect(repository.softDelete).toHaveBeenCalledWith('cat-1', 'user-1');
    });

    it('should throw BadRequestException when deleting a category with children (force=false)', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.hasChildren.mockResolvedValue(true);

      await expect(service.remove('cat-1', false)).rejects.toThrow(BadRequestException);
    });

    it('should force-delete a category and all its descendants (force=true)', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.hasChildren.mockResolvedValue(true);
      repository.findDescendants.mockResolvedValue([childCategory, grandchildCategory]);

      await service.remove('cat-1', true, 'user-1');

      expect(repository.softDelete).toHaveBeenCalledWith('cat-2', 'user-1');
      expect(repository.softDelete).toHaveBeenCalledWith('cat-3', 'user-1');
      expect(repository.softDelete).toHaveBeenCalledWith('cat-1', 'user-1');
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when category is already deleted', async () => {
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(service.remove('cat-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ───── restore ─────

  describe('restore', () => {
    it('should restore a deleted category and set updatedBy', async () => {
      const deletedCategory = { ...baseCategory, deletedAt: new Date(), deletedBy: 'user-1' } as CategoryEntity;
      repository.findById.mockResolvedValue(deletedCategory);
      repository.restore.mockResolvedValue(baseCategory);

      const result = await service.restore('cat-1', 'user-1');

      expect(result.id).toBe('cat-1');
      expect(repository.update).toHaveBeenCalledWith('cat-1', { updatedBy: 'user-1' });
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when category is not deleted', async () => {
      repository.findById.mockResolvedValue(baseCategory);

      await expect(service.restore('cat-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ───── activate / deactivate ─────

  describe('activate', () => {
    it('should activate a deactivated category', async () => {
      const inactiveCategory = { ...baseCategory, isActive: false } as CategoryEntity;
      repository.findById.mockResolvedValue(inactiveCategory);
      repository.update.mockResolvedValue({ ...inactiveCategory, isActive: true } as CategoryEntity);

      const result = await service.activate('cat-1', 'user-1');

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.activate('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when activating a deleted category', async () => {
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(service.activate('cat-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active category', async () => {
      repository.findById.mockResolvedValue(baseCategory);
      repository.update.mockResolvedValue({ ...baseCategory, isActive: false } as CategoryEntity);

      const result = await service.deactivate('cat-1', 'user-1');

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deactivating a deleted category', async () => {
      repository.findById.mockResolvedValue({ ...baseCategory, deletedAt: new Date() } as CategoryEntity);

      await expect(service.deactivate('cat-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ───── getRoots ─────

  describe('getRoots', () => {
    it('should return root categories with children counts', async () => {
      repository.findRoots.mockResolvedValue({
        items: [baseCategory],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      repository.countChildren.mockResolvedValue(2);

      const result = await service.getRoots({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].childrenCount).toBe(2);
    });
  });

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return paginated categories with children counts', async () => {
      repository.findAll.mockResolvedValue({
        items: [baseCategory, childCategory],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      repository.countChildren.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
