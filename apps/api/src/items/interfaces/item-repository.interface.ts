import { Item } from '../entities/item.entity';

export interface IItemRepository {
  findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    isVeg?: boolean;
  }): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  findBySku(sku: string): Promise<Item | null>;
  findByCategory(categoryId: string): Promise<Item[]>;
  create(data: Partial<Item>): Promise<Item>;
  update(id: string, data: Partial<Item>): Promise<Item>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
