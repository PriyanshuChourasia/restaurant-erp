import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum VoucherType {
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  JOURNAL = 'journal',
}

export enum VoucherStatus {
  POSTED = 'posted',
  CANCELLED = 'cancelled',
}

@Entity('vouchers')
@Index('idx_voucher_type', ['voucherType'])
@Index('idx_voucher_date', ['voucherDate'])
@Index('idx_voucher_reference_invoice', ['referenceInvoiceId'])
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'voucher_number', length: 50, unique: true })
  voucherNumber!: string;

  @Column({ type: 'enum', enum: VoucherType, name: 'voucher_type' })
  voucherType!: VoucherType;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.POSTED })
  status!: VoucherStatus;

  @Column({ type: 'date', name: 'voucher_date' })
  voucherDate!: Date;

  @Column({ type: 'varchar', length: 50, name: 'party_type', nullable: true })
  partyType!: string | null;

  @Column({ type: 'uuid', name: 'party_id', nullable: true })
  partyId!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'payment_mode', nullable: true })
  paymentMode!: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: decimalTransformer })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  narration!: string | null;

  @Column({ type: 'uuid', name: 'journal_entry_id' })
  journalEntryId!: string;

  @Column({ type: 'uuid', name: 'reference_invoice_id', nullable: true })
  referenceInvoiceId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
