import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Brackets } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import type { ICustomerRepository, PaginatedCustomerResult } from '../interfaces/customer-repository.interface';
import { QueryCustomerDto } from '../dto/query-customer.dto';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async findAll(query: QueryCustomerDto): Promise<PaginatedCustomerResult> {
    const { page = 1, limit = 20, search, isActive, customerType } = query;

    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.priceLevel', 'priceLevel')
      .where('c.deletedAt IS NULL');

    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub.where('c.name ILIKE :search', { search: `%${search}%` })
            .orWhere('c.phone ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive });
    }

    if (customerType) {
      qb.andWhere('c.customerType = :customerType', { customerType });
    }

    qb.orderBy('c.name', 'ASC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({
      where: { id },
      relations: { priceLevel: true },
      withDeleted: true,
    });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({
      where: { phone },
      withDeleted: true,
    });
  }

  async search(term: string, limit = 10): Promise<Pick<Customer, 'id' | 'name' | 'phone' | 'customerType' | 'priceLevelId'>[]> {
    return this.repo
      .createQueryBuilder('c')
      .select(['c.id', 'c.name', 'c.phone', 'c.customerType', 'c.priceLevelId'])
      .where('c.deletedAt IS NULL')
      .andWhere('c.isActive = :active', { active: true })
      .andWhere(
        new Brackets((sub) => {
          sub.where('c.name ILIKE :term', { term: `%${term}%` })
            .orWhere('c.phone ILIKE :term', { term: `%${term}%` });
        }),
      )
      .orderBy('c.name', 'ASC')
      .take(limit)
      .getMany() as Promise<Pick<Customer, 'id' | 'name' | 'phone' | 'customerType' | 'priceLevelId'>[]>;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { priceLevel: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
