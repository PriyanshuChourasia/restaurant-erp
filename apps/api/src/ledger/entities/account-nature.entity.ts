import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum AccountingEffect {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('account_natures')
export class AccountNature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 20, unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null;

  @Column({
    type: 'enum',
    enum: AccountingEffect,
    name: 'accounting_effect',
    default: AccountingEffect.DEBIT,
  })
  accountingEffect!: AccountingEffect;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
