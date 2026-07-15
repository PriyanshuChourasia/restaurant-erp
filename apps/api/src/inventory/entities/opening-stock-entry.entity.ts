import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { StorageUnit } from './storage-unit.entity';
import { StockMovement } from './inventory.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('opening_stock_entries')
@Unique(['itemId', 'storageUnitId'])
export class OpeningStockEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'storage_unit_id', type: 'uuid' })
  storageUnitId!: string;

  @ManyToOne(() => StorageUnit)
  @JoinColumn({ name: 'storage_unit_id' })
  storageUnit!: StorageUnit;

  @Column({ type: 'decimal', precision: 14, scale: 3, transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'unit_cost', transformer: decimalTransformer })
  unitCost!: number;

  @Column({ type: 'date', name: 'as_of_date' })
  asOfDate!: Date;

  @Column({ name: 'stock_movement_id', type: 'uuid' })
  stockMovementId!: string;

  @ManyToOne(() => StockMovement)
  @JoinColumn({ name: 'stock_movement_id' })
  stockMovement!: StockMovement;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
