import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { StockItem } from '../../stock-items/entities/stock-item.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('production_entries')
export class ProductionEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem)
  @JoinColumn({ name: 'item_id' })
  item!: StockItem;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'batch_quantity', transformer: decimalTransformer })
  batchQuantity!: number;

  @Column({ name: 'produced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  producedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
