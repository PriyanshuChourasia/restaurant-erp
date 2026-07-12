import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { PriceLevel } from './price-level.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('item_price_levels')
@Index('idx_item_price_level_unique', ['itemId', 'priceLevelId'], { unique: true })
@Index('idx_item_price_level_item', ['itemId'])
@Index('idx_item_price_level_level', ['priceLevelId'])
export class ItemPriceLevel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'price_level_id', type: 'uuid' })
  priceLevelId!: string;

  @ManyToOne(() => PriceLevel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_level_id' })
  priceLevel!: PriceLevel;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  price!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
