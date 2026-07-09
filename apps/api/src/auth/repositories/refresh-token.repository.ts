import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  createForUser(userId: string, ttlMs: number, userAgent?: string, ipAddress?: string): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revoke(token: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async createForUser(
    userId: string,
    ttlMs: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = uuidv4() + '-' + uuidv4();
    const expiresAt = new Date(Date.now() + ttlMs);

    const entity = this.repo.create({
      userId,
      token,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    });

    return this.repo.save(entity);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      where: { token, isRevoked: false },
      relations: { user: true },
    });
  }

  async revoke(token: string): Promise<void> {
    await this.repo.update({ token }, { isRevoked: true });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
