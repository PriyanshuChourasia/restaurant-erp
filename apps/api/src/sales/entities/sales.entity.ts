import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum InvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  ONLINE = 'online',
  CREDIT = 'credit',
}

@Entity('invoices')
@Index('idx_invoice_status', ['status'])
@Index('idx_invoice_date', ['invoiceDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_number', length: 50, unique: true })
  invoiceNumber!: string;

  @Column({ type: 'varchar', name: 'customer_name', length: 255, nullable: true })
  customerName!: string | null;

  @Column({ type: 'varchar', name: 'customer_phone', length: 20, nullable: true })
  customerPhone!: string | null;

  @Column({ type: 'varchar', name: 'customer_gstin', length: 20, nullable: true })
  customerGstin!: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer | null;

  @Column({ type: 'simple-json', name: 'table_ids', nullable: true })
  tableIds!: string[] | null;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 , transformer: decimalTransformer })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'cgst_total' , transformer: decimalTransformer })
  cgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'sgst_total' , transformer: decimalTransformer })
  sgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'igst_total' , transformer: decimalTransformer })
  igstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'tax_total' , transformer: decimalTransformer })
  taxTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'discount' , transformer: decimalTransformer })
  discount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'round_off' , transformer: decimalTransformer })
  roundOff!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'grand_total' , transformer: decimalTransformer })
  grandTotal!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'journal_entry_id', nullable: true })
  journalEntryId!: string | null;

  @Column({ type: 'uuid', name: 'voucher_id', nullable: true })
  voucherId!: string | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId!: string | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items!: InvoiceItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @ManyToOne(() => Invoice, (i) => i.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ length: 255 })
  itemName!: string;

  @Column({ length: 20 })
  hsnCode!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 , transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' , transformer: decimalTransformer })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'taxable_value' , transformer: decimalTransformer })
  taxableValue!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'gst_rate' , transformer: decimalTransformer })
  gstRate!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cgst_amount' , transformer: decimalTransformer })
  cgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sgst_amount' , transformer: decimalTransformer })
  sgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' , transformer: decimalTransformer })
  totalAmount!: number;
}
