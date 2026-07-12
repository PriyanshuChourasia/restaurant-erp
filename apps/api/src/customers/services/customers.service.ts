import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CustomerRepository } from '../repositories/customer.repository';
import { PriceLevelRepository } from '../../price-levels/repositories/price-level.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { QueryCustomerDto } from '../dto/query-customer.dto';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly priceLevelRepo: PriceLevelRepository,
  ) {}

  async findAll(query: QueryCustomerDto) {
    return this.customerRepo.findAll(query);
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    // Check unique phone
    const existing = await this.customerRepo.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException(`Customer with phone "${dto.phone}" already exists`);
    }

    // Resolve price level
    const priceLevelId = await this.resolvePriceLevel(dto.customerType || 'regular', dto.priceLevelId);

    return this.customerRepo.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      gstin: dto.gstin ?? null,
      customerType: dto.customerType ?? 'regular',
      priceLevelId,
      isActive: true,
    });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.phone && dto.phone !== customer.phone) {
      const existing = await this.customerRepo.findByPhone(dto.phone);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Customer with phone "${dto.phone}" already exists`);
      }
    }

    const updateData: Partial<Customer> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.gstin !== undefined) updateData.gstin = dto.gstin;

    if (dto.customerType !== undefined || dto.priceLevelId !== undefined) {
      const newType = dto.customerType ?? customer.customerType;
      const explicitPriceLevelId = dto.priceLevelId !== undefined ? dto.priceLevelId : customer.priceLevelId;
      updateData.customerType = newType;
      updateData.priceLevelId = await this.resolvePriceLevel(newType, explicitPriceLevelId);
    }

    return this.customerRepo.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.customerRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.customerRepo.restore(id);
  }

  async search(term: string, limit = 10) {
    if (!term || term.length < 2) return [];
    return this.customerRepo.search(term, limit);
  }

  /**
   * Resolve the price level for a customer:
   * 1. If explicitPriceLevelId is provided, use it (admin override)
   * 2. If customerType is 'regular', use the default price level
   * 3. Otherwise, find a price level whose code matches the customerType
   * 4. If no match, fall back to the default price level
   */
  private async resolvePriceLevel(customerType: string, explicitPriceLevelId?: string | null): Promise<string | null> {
    if (explicitPriceLevelId) return explicitPriceLevelId;

    if (customerType === 'regular') {
      const defaultPL = await this.priceLevelRepo.findDefault();
      return defaultPL?.id ?? null;
    }

    // Try to find a price level whose code matches the customer type
    const matchingPL = await this.priceLevelRepo.findByCode(customerType);
    if (matchingPL) return matchingPL.id;

    // Fall back to default
    const defaultPL = await this.priceLevelRepo.findDefault();
    return defaultPL?.id ?? null;
  }
}
