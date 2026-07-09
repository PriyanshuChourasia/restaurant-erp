import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { RoleRepository } from '../../roles/repositories/role.repository';
import { UsersService } from '../../users/services/users.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenTtlMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly roleRepository: RoleRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN', '15m');
    this.refreshTokenTtlMs =
      parseInt(this.configService.get('REFRESH_TOKEN_TTL_MS', '604800000'), 10); // 7 days default
  }

  private generateTokens(user: User, permissions: string[]) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || '',
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiry as string & { __brand?: never },
    } as any);

    return { accessToken, payload };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<LoginResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: { role: { permissions: true } },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        isActive: true,
        roleId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = user.role?.permissions?.map((p) => p.name) || [];
    const { accessToken } = this.generateTokens(user, permissions);

    // Create refresh token
    const refreshTokenEntity = await this.refreshTokenRepo.createForUser(
      user.id,
      this.refreshTokenTtlMs,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken: refreshTokenEntity.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || '',
        permissions,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<LoginResponseDto> {
    const refreshTokenEntity = await this.refreshTokenRepo.findByToken(dto.refreshToken);

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (refreshTokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token (rotation)
    await this.refreshTokenRepo.revoke(dto.refreshToken);

    const user = await this.userRepo.findOne({
      where: { id: refreshTokenEntity.userId },
      relations: { role: { permissions: true } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const permissions = user.role?.permissions?.map((p) => p.name) || [];
    const { accessToken } = this.generateTokens(user, permissions);

    // Issue new refresh token
    const newRefreshTokenEntity = await this.refreshTokenRepo.createForUser(
      user.id,
      this.refreshTokenTtlMs,
    );

    return {
      accessToken,
      refreshToken: newRefreshTokenEntity.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || '',
        permissions,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepo.revoke(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const defaultRole = await this.roleRepository.findByName('staff');
    if (!defaultRole) {
      throw new BadRequestException(
        'No default role configured. Contact an administrator.',
      );
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      roleId: defaultRole.id,
    });

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
