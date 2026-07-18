import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { StorageUnit } from './storage-unit.entity';
import { StockItem } from '../../stock-items/entities/stock-item.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum StockCountStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
}

@Entity('stock_counts')
@Index(['storageUnitId', 'status'])
export class StockCount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'storage_unit_id', type: 'uuid' })
  storageUnitId!: string;

  @ManyToOne(() => StorageUnit)
  @JoinColumn({ name: 'storage_unit_id' })
  storageUnit!: StorageUnit;

  @Column({ name: 'count_date', type: 'date' })
  countDate!: Date;

  @Column({
    type: 'enum',
    enum: StockCountStatus,
    default: StockCountStatus.DRAFT,
  })
  status!: StockCountStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('stock_count_lines')
@Index(['stockCountId', 'itemId'], { unique: true })
@Index(['itemId'])
export class StockCountLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stock_count_id', type: 'uuid' })
  stockCountId!: string;

  @ManyToOne(() => StockCount)
  @JoinColumn({ name: 'stock_count_id' })
  stockCount!: StockCount;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem)
  @JoinColumn({ name: 'item_id' })
  item!: StockItem;

  @Column({ type: 'decimal', precision: 14, scale: 3, name: 'system_quantity', transformer: decimalTransformer })
  systemQuantity!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, name: 'counted_quantity', nullable: true, transformer: decimalTransformer })
  countedQuantity!: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true, transformer: decimalTransformer })
  variance!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
