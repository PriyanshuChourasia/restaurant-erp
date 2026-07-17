import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum OrderType {
  REGULAR = 'regular',
  PARTY = 'party',
  SCHEDULED = 'scheduled',
}

export enum FulfillmentMethod {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  BILLED = 'billed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
@Index('idx_order_status', ['status'])
@Index('idx_order_type', ['orderType'])
@Index('idx_order_scheduled_for', ['scheduledFor'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber!: string;

  @Column({ type: 'enum', enum: OrderType, name: 'order_type', default: OrderType.REGULAR })
  orderType!: OrderType;

  @Column({ type: 'enum', enum: FulfillmentMethod, name: 'fulfillment_method', default: FulfillmentMethod.DINE_IN })
  fulfillmentMethod!: FulfillmentMethod;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_CONFIRMATION })
  status!: OrderStatus;

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

  @Column({ name: 'reservation_id', type: 'uuid', nullable: true })
  reservationId!: string | null;

  @Column({ type: 'timestamp', name: 'scheduled_for', nullable: true })
  scheduledFor!: Date | null;

  @Column({ type: 'int', name: 'party_size', nullable: true })
  partySize!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'discount_percent', nullable: true, transformer: decimalTransformer })
  discountPercent!: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, transformer: decimalTransformer })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'cgst_total', transformer: decimalTransformer })
  cgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'sgst_total', transformer: decimalTransformer })
  sgstTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'tax_total', transformer: decimalTransformer })
  taxTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'grand_total', transformer: decimalTransformer })
  grandTotal!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'invoice_id', nullable: true })
  invoiceId!: string | null;

  @Column({ type: 'boolean', name: 'kot_sent', default: false })
  kotSent!: boolean;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ length: 255 })
  itemName!: string;

  @Column({ length: 20 })
  hsnCode!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price', transformer: decimalTransformer })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'taxable_value', transformer: decimalTransformer })
  taxableValue!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'gst_rate', transformer: decimalTransformer })
  gstRate!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cgst_amount', transformer: decimalTransformer })
  cgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sgst_amount', transformer: decimalTransformer })
  sgstAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount', transformer: decimalTransformer })
  totalAmount!: number;
}
