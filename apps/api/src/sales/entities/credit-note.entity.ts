import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';
import { Invoice } from './sales.entity';

export enum CreditNoteStatus {
  POSTED = 'posted',
  CANCELLED = 'cancelled',
}

@Entity('credit_notes')
@Index('idx_credit_note_invoice', ['invoiceId'])
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'credit_note_number', length: 50, unique: true })
  creditNoteNumber!: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ name: 'invoice_number', length: 50 })
  invoiceNumber!: string;

  @Column({ type: 'enum', enum: CreditNoteStatus, default: CreditNoteStatus.POSTED })
  status!: CreditNoteStatus;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

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

  @Column({ type: 'uuid', name: 'journal_entry_id' })
  journalEntryId!: string;

  @Column({ type: 'uuid', name: 'replacement_invoice_id', nullable: true })
  replacementInvoiceId!: string | null;

  @OneToMany(() => CreditNoteItem, (item) => item.creditNote, { cascade: true })
  items!: CreditNoteItem[];

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('credit_note_items')
export class CreditNoteItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'credit_note_id', type: 'uuid' })
  creditNoteId!: string;

  @ManyToOne(() => CreditNote, (cn) => cn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_note_id' })
  creditNote!: CreditNote;

  @Column({ name: 'invoice_item_id', type: 'uuid' })
  invoiceItemId!: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ name: 'item_name', length: 255 })
  itemName!: string;

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

  @Column({ name: 'stock_restored', default: false })
  stockRestored!: boolean;
}
