import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../../roles/repositories/role.repository';
import { User } from '../entities/user.entity';

// Mock bcrypt entirely — jest.spyOn doesn't work because bcrypt uses
// non-configurable property descriptors (native C++ addon).
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashed',
    phone: null,
    isActive: true,
    roleId: 'role-1',
    role: { id: 'role-1', name: 'admin' } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            findWithDeleted: jest.fn(),
          },
        },
        {
          provide: RoleRepository,
          useValue: {
            findById: jest.fn(),
            findByName: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
    roleRepository = module.get(RoleRepository) as jest.Mocked<RoleRepository>;
  });

  // ───── findAll ─────

  describe('findAll', () => {
    it('should return all users without passwordHash', async () => {
      const mockUsers = [
        { ...mockUser, id: '1', name: 'Alice' },
        { ...mockUser, id: '2', name: 'Bob' },
      ] as User[];
      userRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect((result[0] as Record<string, unknown>).passwordHash).toBeUndefined();
      expect((result[1] as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });

  // ───── findOne ─────

  describe('findOne', () => {
    it('should return a user by id without passwordHash', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow('User with ID "nonexistent" not found');
    });
  });

  // ───── findByEmail ─────

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBe(mockUser);
    });

    it('should return null when email not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  // ───── create ─────

  describe('create', () => {
    const createDto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
      phone: '1234567890',
      roleId: 'role-1',
    };

    it('should create a user on valid data', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findById.mockResolvedValue({ id: 'role-1', name: 'staff' } as any);
      userRepository.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user',
        name: 'New User',
        email: 'new@example.com',
      } as User);

      const result = await service.create(createDto);

      expect(result.id).toBe('new-user');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New User',
          email: 'new@example.com',
          roleId: 'role-1',
          isActive: true,
        }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'User with email "new@example.com" already exists',
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Role with ID "role-1" not found');
    });
  });

  // ───── update ─────

  describe('update', () => {
    const updateDto = { name: 'Updated Name', email: 'updated@example.com' };

    it('should update a user', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
        email: 'updated@example.com',
      } as User);

      const result = await service.update('user-1', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new email is taken', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue({ id: 'other-user', email: 'updated@example.com' } as User);

      await expect(service.update('user-1', { email: 'updated@example.com' })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when new role does not exist', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.update('user-1', { roleId: 'nonexistent-role' })).rejects.toThrow(NotFoundException);
    });
  });

  // ───── remove ─────

  describe('remove', () => {
    it('should soft-delete a user', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      await service.remove('user-1');

      expect(userRepository.softDelete).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ───── restore ─────

  describe('restore', () => {
    const deletedUser = { ...mockUser, deletedAt: new Date() } as User;

    it('should restore a deleted user', async () => {
      userRepository.findWithDeleted.mockResolvedValue(deletedUser);
      userRepository.restore.mockResolvedValue({ ...deletedUser, deletedAt: null } as User);

      const result = await service.restore('user-1');

      expect(result.id).toBe('user-1');
      expect(result.deletedAt).toBeNull();
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException when user not found even with deleted', async () => {
      userRepository.findWithDeleted.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user is not deleted', async () => {
      userRepository.findWithDeleted.mockResolvedValue(mockUser);

      await expect(service.restore('user-1')).rejects.toThrow(ConflictException);
      await expect(service.restore('user-1')).rejects.toThrow('is not deleted');
    });
  });
});
