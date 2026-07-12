import { ItemPriceLevel } from '../entities/item-price-level.entity';

export interface PricingGridRow {
  itemId: string;
  itemName: string;
  sku: string;
  hsnCode: string;
  gstRate: number;
  unit: string;
  categoryId: string | null;
  categoryName: string | null;
  basePrice: number;
  overridePrice: number | null;
  effectivePrice: number;
}

export interface IItemPriceLevelRepository {
  findByPriceLevel(priceLevelId: string): Promise<ItemPriceLevel[]>;
  findByItemAndLevel(itemId: string, priceLevelId: string): Promise<ItemPriceLevel | null>;
  upsert(itemId: string, priceLevelId: string, price: number): Promise<ItemPriceLevel>;
  bulkUpsert(priceLevelId: string, entries: { itemId: string; price: number }[]): Promise<void>;
  remove(itemId: string, priceLevelId: string): Promise<void>;
  removeByPriceLevel(priceLevelId: string): Promise<void>;
}
