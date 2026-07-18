import { StockItem } from '../entities/stock-item.entity';

export interface IStockItemRepository {
  findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    group?: string;
    stockCategoryId?: string;
    isActive?: boolean;
    isVeg?: boolean;
  }): Promise<{ items: StockItem[]; total: number }>;
  findById(id: string): Promise<StockItem | null>;
  findBySku(sku: string): Promise<StockItem | null>;
  findByCategory(categoryId: string): Promise<StockItem[]>;
  create(data: Partial<StockItem>): Promise<StockItem>;
  update(id: string, data: Partial<StockItem>): Promise<StockItem>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
