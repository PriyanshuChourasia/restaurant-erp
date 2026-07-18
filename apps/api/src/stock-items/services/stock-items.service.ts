import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { StockItemRepository } from '../repositories/stock-item.repository';
import { CreateStockItemDto } from '../dto/create-stock-item.dto';
import { UpdateStockItemDto } from '../dto/update-stock-item.dto';
import { QueryStockItemDto } from '../dto/query-stock-item.dto';
import { StockItem, GstRate } from '../entities/stock-item.entity';

@Injectable()
export class StockItemsService {
  constructor(private readonly stockItemRepo: StockItemRepository) {}

  async findAll(query: QueryStockItemDto) {
    const { page = 1, limit = 20, search, categoryId, group, stockCategoryId, isActive, isVeg } = query;
    return this.stockItemRepo.findAll({ page, limit, search, categoryId, group, stockCategoryId, isActive, isVeg });
  }

  async findById(id: string): Promise<StockItem> {
    const item = await this.stockItemRepo.findById(id);
    if (!item) throw new NotFoundException(`Stock item with ID "${id}" not found`);
    return item;
  }

  async create(dto: CreateStockItemDto): Promise<StockItem> {
    const existing = await this.stockItemRepo.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Stock item with SKU "${dto.sku}" already exists`);
    }
    return this.stockItemRepo.create({
      ...dto,
      gstRate: dto.gstRate ?? GstRate.EIGHTEEN,
    });
  }

  async update(id: string, dto: UpdateStockItemDto): Promise<StockItem> {
    await this.findById(id);

    if (dto.sku) {
      const existing = await this.stockItemRepo.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Stock item with SKU "${dto.sku}" already exists`);
      }
    }

    return this.stockItemRepo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.stockItemRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.stockItemRepo.restore(id);
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
