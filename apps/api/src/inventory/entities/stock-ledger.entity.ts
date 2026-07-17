import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Unit } from '../../units/entities/unit.entity';
import { StorageUnit } from './storage-unit.entity';
import { StockBatch } from './stock-batch.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

/**
 * Stock Ledger — a comprehensive audit trail for all inventory transactions.
 * Every stock movement (purchase receipt, sale, adjustment, transfer, wastage, etc.)
 * is recorded here as a signed quantity change with a reference to the source document.
 *
 * Unlike `stock_movements` (which tracks operational stock with balance snapshots),
 * this ledger focuses on polymorphic reference tracking, per-transaction unit cost,
 * and a signed `quantityChange` (positive = stock in, negative = stock out).
 *
 * The `superKey` is a business-facing sequential BIGINT for display/reference,
 * while `id` is the UUID used internally for all FK relationships.
 */
@Entity('stock_ledgers')
@Index('idx_stock_ledger_stock_item', ['stockItemId'])
@Index('idx_stock_ledger_warehouse', ['warehouseId'])
@Index('idx_stock_ledger_date', ['transactionDate'])
@Index('idx_stock_ledger_reference', ['referenceType', 'referenceId'])
@Index('idx_stock_ledger_batch', ['batchId'])
export class StockLedger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  // ── Item & Warehouse ───────────────────────────────────────────

  @Column({ name: 'stock_item_id', type: 'uuid' })
  stockItemId!: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'stock_item_id' })
  stockItem!: Unit;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => StorageUnit)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: StorageUnit;

  // ── Transaction Type ───────────────────────────────────────────

  @Column({
    type: 'varchar',
    length: 50,
    name: 'transaction_type',
  })
  transactionType!: string;

  // ── Polymorphic Reference ──────────────────────────────────────

  /** Type of the source document (e.g. purchase, sale, adjustment, transfer, wastage) */
  @Column({ type: 'varchar', length: 50, name: 'reference_type', nullable: true })
  referenceType!: string | null;

  /** ID of the source document record */
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  // ── Quantity & Cost ────────────────────────────────────────────

  /**
   * Signed quantity change — positive for stock received/produced in,
   * negative for stock sold/consumed/wasted out.
   */
  @Column({
    type: 'decimal', precision: 18, scale: 3,
    name: 'quantity_change',
    transformer: decimalTransformer,
  })
  quantityChange!: number;

  /** Cost per unit at the time of this transaction */
  @Column({
    type: 'decimal', precision: 18, scale: 2,
    name: 'unit_cost', nullable: true,
    transformer: decimalTransformer,
  })
  unitCost!: number | null;

  // ── Batch Tracking ─────────────────────────────────────────────

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId!: string | null;

  @ManyToOne(() => StockBatch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch!: StockBatch | null;

  // ── Date & Remarks ─────────────────────────────────────────────

  /** Date when the transaction actually occurred (may differ from created_at) */
  @Column({ name: 'transaction_date', type: 'timestamp' })
  transactionDate!: Date;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  // ── Audit ──────────────────────────────────────────────────────

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
