import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Voucher Modules — a lookup table categorizing which subsystem a voucher type
 * belongs to (e.g. Accounting, Inventory, Sales, Purchase). This replaces the
 * old `VoucherModule` enum with a proper FK relationship.
 *
 * The `code` field is the stable identifier used in application logic (e.g.
 * 'accounting', 'inventory', 'sales', 'purchase').
 */
@Entity('voucher_modules')
@Index('idx_vm_code', ['code'], { unique: true })
@Index('idx_vm_active', ['isActive'])
export class VoucherModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  /** Stable logical code (e.g. 'accounting', 'inventory', 'sales', 'purchase') */
  @Column({ length: 30, unique: true })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_system', default: true })
  isSystem!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
