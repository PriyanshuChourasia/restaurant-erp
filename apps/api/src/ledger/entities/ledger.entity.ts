import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum LedgerEntryType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum LedgerCategory {
  SALES = 'sales',
  PURCHASE = 'purchase',
  EXPENSE = 'expense',
  SALARY = 'salary',
  TAX = 'tax',
  MISCELLANEOUS = 'miscellaneous',
}

@Entity('ledger_accounts')
export class LedgerAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'opening_balance' })
  openingBalance!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'current_balance' })
  currentBalance!: number;

  @Column({ type: 'varchar', name: 'financial_year', length: 20, nullable: true })
  financialYear!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('ledger_entries')
@Index('idx_ledger_account', ['accountId'])
@Index('idx_ledger_date', ['entryDate'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: Date;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  type!: LedgerEntryType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: LedgerCategory,
    default: LedgerCategory.MISCELLANEOUS,
  })
  category!: LedgerCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'balance_after' })
  balanceAfter!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
