import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockItem } from '../../inventory/entities/stock-item.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

/**
 * Stock Items Master — the `units` table holds every inventoried item (raw materials,
 * finished goods, packaging, etc.). Each item belongs to a stock group (e.g. RM/FG/PKG)
 * and optionally a stock category, and is measured in a specific unit of measure.
 *
 * Note: opening_value is computed on the UI as opening_quantity × opening_rate;
 * it is not stored in the database.
 */
@Entity('stock_items_master')
@Index('idx_stock_items_master_code', ['code'], { unique: true })
@Index('idx_stock_items_master_active', ['isActive'])
@Index('idx_stock_items_master_stock_group', ['stockGroupId'])
@Index('idx_stock_items_master_stock_category', ['stockCategoryId'])
@Index('idx_stock_items_master_uom', ['unitId'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  @Column({ length: 20, unique: true })
  code!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  alias!: string | null;

  // ── Classification ───────────────────────────────────────────

  // Nullable: existing `units` rows predate the Stock Items Master feature and have no
  // group assigned yet — making this required would break synchronize against that data.
  @Column({ name: 'stock_group_id', type: 'uuid', nullable: true })
  stockGroupId!: string | null;

  @ManyToOne(() => StockItem, { nullable: true })
  @JoinColumn({ name: 'stock_group_id' })
  stockGroup!: StockItem | null;

  @Column({ name: 'stock_category_id', type: 'uuid', nullable: true })
  stockCategoryId!: string | null;

  @ManyToOne(() => StockItem, { nullable: true })
  @JoinColumn({ name: 'stock_category_id' })
  stockCategory!: StockItem | null;

  // ── Unit of Measure ──────────────────────────────────────────

  // Nullable for the same reason as stockGroupId above — existing rows predate this FK.
  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId!: string | null;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unitOfMeasure!: UnitOfMeasure | null;

  // ── Description ──────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // ── Opening & Reorder ────────────────────────────────────────

  @Column({
    type: 'decimal', precision: 18, scale: 3,
    name: 'opening_quantity', nullable: true,
    transformer: decimalTransformer,
  })
  openingQuantity!: number | null;

  @Column({
    type: 'decimal', precision: 18, scale: 2,
    name: 'opening_rate', nullable: true,
    transformer: decimalTransformer,
  })
  openingRate!: number | null;

  /**
   * Reorder level — when stock falls below this, trigger a purchase order.
   */
  @Column({
    type: 'decimal', precision: 18, scale: 3,
    name: 'reorder_level', nullable: true,
    transformer: decimalTransformer,
  })
  reorderLevel!: number | null;

  // ── Tax & Barcode ────────────────────────────────────────────

  @Column({ type: 'varchar', length: 20, name: 'hsn_code', nullable: true })
  hsnCode!: string | null;

  @Column({
    type: 'decimal', precision: 5, scale: 2,
    name: 'gst_rate', nullable: true,
    transformer: decimalTransformer,
  })
  gstRate!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode!: string | null;

  // ── Tracking ─────────────────────────────────────────────────

  @Column({ name: 'track_batch', default: false })
  trackBatch!: boolean;

  @Column({ name: 'track_expiry', default: false })
  trackExpiry!: boolean;

  // ── Status ───────────────────────────────────────────────────

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // ── Timestamps ───────────────────────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Audit ────────────────────────────────────────────────────

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;
}
