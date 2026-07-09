import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.find({ relations: { role: true } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      relations: { role: true },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { role: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<User> {
    await this.repo.restore(id);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { role: true },
    });
  }

  async findWithDeleted(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: true,
      relations: { role: true },
    });
  }
}
