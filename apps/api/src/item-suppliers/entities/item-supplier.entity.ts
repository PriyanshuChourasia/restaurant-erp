import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { StockItem } from '../../stock-items/entities/stock-item.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { UnitOfMeasure } from '../../units/entities/unit-of-measure.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('item_suppliers')
@Unique(['itemId', 'supplierId'])
@Index('idx_item_supplier_item', ['itemId'])
@Index('idx_item_supplier_supplier', ['supplierId'])
@Index('idx_item_supplier_preferred', ['itemId', 'isPreferred'])
export class ItemSupplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: StockItem;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  /** The supplier's own SKU/code for this item */
  @Column({ type: 'varchar', name: 'supplier_sku', length: 100, nullable: true })
  supplierSku!: string | null;

  /** Unit price from this supplier (in the specified unit) */
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price', transformer: decimalTransformer })
  unitPrice!: number;

  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId!: string | null;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitOfMeasure | null;

  @Column({ name: 'lead_time_days', type: 'int', default: 0 })
  leadTimeDays!: number;

  @Column({ name: 'is_preferred', default: false })
  isPreferred!: boolean;

  @Column({ name: 'min_order_qty', type: 'decimal', precision: 14, scale: 3, default: 0, transformer: decimalTransformer })
  minOrderQty!: number;

  @Column({ name: 'last_purchase_date', type: 'date', nullable: true })
  lastPurchaseDate!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'last_purchase_price', default: 0, transformer: decimalTransformer })
  lastPurchasePrice!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
