import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ItemRepository } from '../repositories/item.repository';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { QueryItemDto } from '../dto/query-item.dto';
import { Item, GstRate } from '../entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(private readonly itemRepo: ItemRepository) {}

  async findAll(query: QueryItemDto) {
    const { page = 1, limit = 20, search, categoryId, isActive, isVeg } = query;
    return this.itemRepo.findAll({ page, limit, search, categoryId, isActive, isVeg });
  }

  async findById(id: string): Promise<Item> {
    const item = await this.itemRepo.findById(id);
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found`);
    return item;
  }

  async create(dto: CreateItemDto): Promise<Item> {
    const existing = await this.itemRepo.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Item with SKU "${dto.sku}" already exists`);
    }
    return this.itemRepo.create({
      ...dto,
      gstRate: dto.gstRate ?? GstRate.EIGHTEEN,
    });
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    await this.findById(id);

    if (dto.sku) {
      const existing = await this.itemRepo.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Item with SKU "${dto.sku}" already exists`);
      }
    }

    return this.itemRepo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.itemRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.itemRepo.restore(id);
  }

  async getGstBreakdown(price: number, gstRate: GstRate) {
    const rate = Number(gstRate);
    const taxableValue = price / (1 + rate / 100);
    const gstAmount = price - taxableValue;
    return {
      taxableValue: Math.round(taxableValue * 100) / 100,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      totalGst: Math.round(gstAmount * 100) / 100,
      rate,
    };
  }
}
