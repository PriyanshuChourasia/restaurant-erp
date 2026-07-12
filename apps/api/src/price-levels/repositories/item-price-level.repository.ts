import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemPriceLevel } from '../entities/item-price-level.entity';
import type { IItemPriceLevelRepository, PricingGridRow } from '../interfaces/item-price-level-repository.interface';

@Injectable()
export class ItemPriceLevelRepository implements IItemPriceLevelRepository {
  constructor(
    @InjectRepository(ItemPriceLevel)
    private readonly repo: Repository<ItemPriceLevel>,
  ) {}

  async findByPriceLevel(priceLevelId: string): Promise<ItemPriceLevel[]> {
    return this.repo.find({
      where: { priceLevelId },
      relations: { item: true },
    });
  }

  async findByItemAndLevel(itemId: string, priceLevelId: string): Promise<ItemPriceLevel | null> {
    return this.repo.findOne({
      where: { itemId, priceLevelId },
    });
  }

  async upsert(itemId: string, priceLevelId: string, price: number): Promise<ItemPriceLevel> {
    const existing = await this.repo.findOne({ where: { itemId, priceLevelId } });
    if (existing) {
      existing.price = price;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ itemId, priceLevelId, price }));
  }

  async bulkUpsert(priceLevelId: string, entries: { itemId: string; price: number }[]): Promise<void> {
    await this.repo.upsert(
      entries.map((e) => ({
        itemId: e.itemId,
        priceLevelId,
        price: e.price,
      })),
      ['itemId', 'priceLevelId'],
    );
  }

  async remove(itemId: string, priceLevelId: string): Promise<void> {
    await this.repo.delete({ itemId, priceLevelId });
  }

  async removeByPriceLevel(priceLevelId: string): Promise<void> {
    await this.repo.delete({ priceLevelId });
  }
}
