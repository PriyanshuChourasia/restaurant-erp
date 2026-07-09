import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../../roles/repositories/role.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async findAll() {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.excludePassword(u));
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.excludePassword(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID "${dto.roleId}" not found`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      roleId: dto.roleId,
      isActive: true,
    });

    return this.excludePassword(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException(
          `User with email "${dto.email}" already exists`,
        );
      }
    }

    if (dto.roleId) {
      const role = await this.roleRepository.findById(dto.roleId);
      if (!role) {
        throw new NotFoundException(`Role with ID "${dto.roleId}" not found`);
      }
    }

    const updateData: Partial<User> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.roleId) updateData.roleId = dto.roleId;

    const updated = await this.userRepository.update(id, updateData);
    return this.excludePassword(updated);
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    await this.userRepository.softDelete(id);
  }

  async restore(id: string) {
    const user = await this.userRepository.findWithDeleted(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    if (!user.deletedAt) {
      throw new ConflictException(`User with ID "${id}" is not deleted`);
    }
    const restored = await this.userRepository.restore(id);
    return this.excludePassword(restored);
  }

  private excludePassword(user: User): SafeUser {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
