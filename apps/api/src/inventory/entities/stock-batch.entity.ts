import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { StockItem } from '../../stock-items/entities/stock-item.entity';
import { StorageUnit } from './storage-unit.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum BatchStatus {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
  WRITTEN_OFF = 'written_off',
}

@Entity('stock_batches')
@Index(['itemId', 'storageUnitId', 'expiryDate'])
@Index(['itemId', 'storageUnitId', 'status'])
export class StockBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem)
  @JoinColumn({ name: 'item_id' })
  item!: StockItem;

  @Column({ name: 'storage_unit_id', type: 'uuid' })
  storageUnitId!: string;

  @ManyToOne(() => StorageUnit)
  @JoinColumn({ name: 'storage_unit_id' })
  storageUnit!: StorageUnit;

  @Column({ name: 'purchase_id', type: 'uuid', nullable: true })
  purchaseId!: string | null;

  @Column({ name: 'parent_batch_id', type: 'uuid', nullable: true })
  parentBatchId!: string | null;

  @Column({ name: 'batch_number', length: 100 })
  batchNumber!: string;

  @Column({ type: 'decimal', precision: 14, scale: 3, name: 'quantity_received', transformer: decimalTransformer })
  quantityReceived!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, name: 'quantity_remaining', transformer: decimalTransformer })
  quantityRemaining!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'unit_cost', transformer: decimalTransformer })
  unitCost!: number;

  @Column({ name: 'received_date', type: 'date' })
  receivedDate!: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate!: Date | null;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.ACTIVE,
  })
  status!: BatchStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
