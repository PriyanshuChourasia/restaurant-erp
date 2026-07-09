import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { RoleRepository } from '../../roles/repositories/role.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

// Mock bcrypt entirely — jest.spyOn doesn't work because bcrypt uses
// non-configurable property descriptors (native C++ addon).
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
}));

// uuid v9+ is ESM-only — RefreshTokenRepository imports it, so mock it.
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let refreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    isActive: true,
    roleId: 'role-1',
    role: {
      id: 'role-1',
      name: 'admin',
      permissions: [
        { id: 'p1', name: 'users.read' },
        { id: 'p2', name: 'users.write' },
      ],
    },
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as User;

  const mockRefreshToken = {
    id: 'rt-1',
    userId: 'user-1',
    token: 'uuid-uuid',
    expiresAt: new Date(Date.now() + 100000),
    isRevoked: false,
    userAgent: 'test-agent',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    user: mockUser,
  } as unknown as RefreshToken;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: RoleRepository,
          useValue: {
            findByName: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            createForUser: jest.fn(),
            findByToken: jest.fn(),
            revoke: jest.fn(),
            revokeAllForUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_EXPIRES_IN: '15m',
                REFRESH_TOKEN_TTL_MS: '604800000',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    roleRepository = module.get(RoleRepository) as jest.Mocked<RoleRepository>;
    refreshTokenRepo = module.get(RefreshTokenRepository) as jest.Mocked<RefreshTokenRepository>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  // ───── login ─────

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };

    it('should return LoginResponseDto on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-access-token');
      refreshTokenRepo.createForUser.mockResolvedValue(mockRefreshToken);

      const result = await service.login(loginDto, 'agent', '127.0.0.1');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('uuid-uuid');
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('admin');
      expect(result.user.permissions).toEqual(['users.read', 'users.write']);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        relations: { role: { permissions: true } },
        select: { id: true, name: true, email: true, passwordHash: true, isActive: true, roleId: true },
      });
      expect(refreshTokenRepo.createForUser).toHaveBeenCalledWith('user-1', 604800000, 'agent', '127.0.0.1');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when account is deactivated', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false } as unknown as User);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Account is deactivated');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  // ───── refresh ─────

  describe('refresh', () => {
    const refreshDto = { refreshToken: 'valid-token' };

    it('should return new tokens on valid refresh token', async () => {
      refreshTokenRepo.findByToken.mockResolvedValue(mockRefreshToken);
      userRepo.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');
      refreshTokenRepo.createForUser.mockResolvedValue({
        ...mockRefreshToken,
        token: 'new-refresh-token',
      });

      const result = await service.refresh(refreshDto);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(refreshTokenRepo.revoke).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when token is not found', async () => {
      refreshTokenRepo.findByToken.mockResolvedValue(null);

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshDto)).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      refreshTokenRepo.findByToken.mockResolvedValue({
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      } as unknown as RefreshToken);

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshDto)).rejects.toThrow('Refresh token has expired');
    });

    it('should throw UnauthorizedException when user is inactive after refresh', async () => {
      refreshTokenRepo.findByToken.mockResolvedValue(mockRefreshToken);
      userRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false } as unknown as User);

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshDto)).rejects.toThrow('User account is inactive or not found');
    });
  });

  // ───── logout ─────

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      await service.logout('some-token');
      expect(refreshTokenRepo.revoke).toHaveBeenCalledWith('some-token');
    });
  });

  // ───── logoutAll ─────

  describe('logoutAll', () => {
    it('should revoke all tokens for the user', async () => {
      await service.logoutAll('user-1');
      expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  // ───── register ─────

  describe('register', () => {
    const registerDto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
      phone: '1234567890',
    };

    it('should create a user on valid data', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue({ id: 'staff-role' } as any);
      usersService.create.mockResolvedValue({ id: 'new-user' } as any);

      const result = await service.register(registerDto);

      expect(result).toEqual({ id: 'new-user' });
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
        phone: '1234567890',
        roleId: 'staff-role',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with email "new@example.com" already exists',
      );
    });

    it('should throw BadRequestException when no default role is configured', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'No default role configured',
      );
    });
  });

  // ───── getProfile ─────

  describe('getProfile', () => {
    it('should return user profile', async () => {
      usersService.findOne.mockResolvedValue({ id: 'user-1', name: 'Test User' } as any);

      const result = await service.getProfile('user-1');

      expect(result).toEqual({ id: 'user-1', name: 'Test User' });
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findOne.mockResolvedValue(null as any);

      await expect(service.getProfile('user-1')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('user-1')).rejects.toThrow('User not found');
    });
  });
});
