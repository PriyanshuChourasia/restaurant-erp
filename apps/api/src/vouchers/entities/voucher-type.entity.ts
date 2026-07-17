import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VoucherModuleEntity } from './voucher-module.entity';

/**
 * Voucher Types master data — defines categories of vouchers (e.g. Payment, Receipt,
 * Journal, Credit Note, Debit Note) with flags indicating which subsystems they affect.
 * The `code` field is the stable identifier used throughout the application logic;
 * `id` is the UUID used for FK relationships from the Voucher entity.
 */
@Entity('voucher_types')
@Index('idx_vt_code', ['code'], { unique: true })
@Index('idx_vt_active', ['isActive'])
@Index('idx_vt_module', ['voucherModuleId'])
export class VoucherType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  /** Stable logical code (e.g. 'payment', 'receipt', 'journal') — used in app logic */
  @Column({ length: 30, unique: true })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'voucher_module_id', type: 'uuid' })
  voucherModuleId!: string;

  @ManyToOne(() => VoucherModuleEntity)
  @JoinColumn({ name: 'voucher_module_id' })
  voucherModule!: VoucherModuleEntity;

  @Column({ name: 'affects_accounts', default: false })
  affectsAccounts!: boolean;

  @Column({ name: 'affects_inventory', default: false })
  affectsInventory!: boolean;

  @Column({ name: 'affects_tax', default: false })
  affectsTax!: boolean;

  @Column({ name: 'is_system', default: true })
  isSystem!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
