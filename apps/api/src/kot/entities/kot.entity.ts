import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum KotStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum KotStation {
  MAIN_KITCHEN = 'main_kitchen',
  TANDOOR = 'tandoor',
  BEVERAGES = 'beverages',
  DESSERTS = 'desserts',
  SNACKS = 'snacks',
}

@Entity('kots')
@Index('idx_kot_status', ['status'])
@Index('idx_kot_station', ['station'])
@Index('idx_kot_order', ['orderId'])
export class Kot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'kot_number', length: 50, unique: true })
  kotNumber!: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'simple-json', name: 'table_ids', nullable: true })
  tableIds!: string[] | null;

  @Column({
    type: 'enum',
    enum: KotStatus,
    default: KotStatus.PENDING,
  })
  status!: KotStatus;

  @Column({
    type: 'enum',
    enum: KotStation,
    default: KotStation.MAIN_KITCHEN,
  })
  station!: KotStation;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'prepared_by', type: 'uuid', nullable: true })
  preparedBy!: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'served_at', type: 'timestamp', nullable: true })
  servedAt!: Date | null;

  @OneToMany(() => KotItem, (item) => item.kot, { cascade: true })
  items!: KotItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('kot_items')
export class KotItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'kot_id', type: 'uuid' })
  kotId!: string;

  @ManyToOne(() => Kot, (k) => k.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kot_id' })
  kot!: Kot;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ length: 255 })
  itemName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 , transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({
    type: 'enum',
    enum: KotStatus,
    default: KotStatus.PENDING,
  })
  status!: KotStatus;
}
