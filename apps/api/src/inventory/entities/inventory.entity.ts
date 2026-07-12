import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum MovementType {
  OPENING_BALANCE = 'opening_balance',
  PURCHASE_IN = 'purchase_in',
  SALE_OUT = 'sale_out',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  WASTAGE = 'wastage',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  PRODUCTION_CONSUMPTION = 'production_consumption',
  PRODUCTION_YIELD = 'production_in',
}

@Entity('inventory')
@Index('idx_inventory_item', ['itemId'])
@Index('idx_inventory_status', ['status'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0, name: 'opening_balance' , transformer: decimalTransformer })
  openingBalance!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0, name: 'current_stock' , transformer: decimalTransformer })
  currentStock!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0, name: 'min_stock_level' , transformer: decimalTransformer })
  minStockLevel!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'unit_cost' , transformer: decimalTransformer })
  unitCost!: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('stock_movements')
@Index('idx_stock_movement_item', ['itemId'])
@Index('idx_stock_movement_date', ['createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ type: 'enum', enum: MovementType })
  type!: MovementType;

  @Column({ type: 'decimal', precision: 14, scale: 3 , transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0, name: 'balance_before' , transformer: decimalTransformer })
  balanceBefore!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0, name: 'balance_after' , transformer: decimalTransformer })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
