import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Item } from '../../items/entities/item.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum PurchaseStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('purchases')
@Index('idx_purchase_status', ['status'])
@Index('idx_purchase_date', ['purchaseDate'])
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'purchase_number', length: 50, unique: true })
  purchaseNumber!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.DRAFT,
  })
  status!: PurchaseStatus;

  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate!: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 , transformer: decimalTransformer })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 , transformer: decimalTransformer })
  discount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'tax_amount' , transformer: decimalTransformer })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'total_amount' , transformer: decimalTransformer })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => PurchaseItem, (item) => item.purchase, { cascade: true })
  items!: PurchaseItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @ManyToOne(() => Purchase, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ type: 'decimal', precision: 12, scale: 2 , transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' , transformer: decimalTransformer })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'gst_rate' , transformer: decimalTransformer })
  gstRate!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'total_price' , transformer: decimalTransformer })
  totalPrice!: number;
}
