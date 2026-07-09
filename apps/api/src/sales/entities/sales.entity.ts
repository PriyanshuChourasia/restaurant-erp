import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';

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

  @Column({ type: 'simple-json', name: 'table_numbers', nullable: true })
  tableNumbers!: string[] | null;

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

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'cgst_total' })
  cgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'sgst_total' })
  sgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'igst_total' })
  igstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'tax_total' })
  taxTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'discount' })
  discount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'round_off' })
  roundOff!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'grand_total' })
  grandTotal!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'taxable_value' })
  taxableValue!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'gst_rate' })
  gstRate!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cgst_amount' })
  cgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sgst_amount' })
  sgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount!: number;
}
