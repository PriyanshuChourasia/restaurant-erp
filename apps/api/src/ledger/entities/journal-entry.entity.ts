import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum JournalSourceType {
  INVOICE = 'invoice',
  VOUCHER = 'voucher',
  STOCK_MOVEMENT = 'stock_movement',
  MANUAL = 'manual',
  REVERSAL = 'reversal',
  CREDIT_NOTE = 'credit_note',
}

@Entity('journal_entries')
@Index('idx_journal_entry_date', ['entryDate'])
@Index('idx_journal_entry_source', ['sourceType', 'sourceId'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entry_number', length: 50, unique: true })
  entryNumber!: string;

  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: Date;

  @Column({ type: 'text', nullable: true })
  narration!: string | null;

  @Column({ type: 'enum', enum: JournalSourceType, name: 'source_type' })
  sourceType!: JournalSourceType;

  @Column({ type: 'uuid', name: 'source_id', nullable: true })
  sourceId!: string | null;

  @Column({ type: 'uuid', name: 'reversal_of_id', nullable: true })
  reversalOfId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
