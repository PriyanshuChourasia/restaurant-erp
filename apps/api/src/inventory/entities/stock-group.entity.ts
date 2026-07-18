import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockCategory } from './stock-category.entity';

/**
 * Stock Groups — a hierarchical taxonomy for classifying inventory items
 * (e.g. RM = Raw Material, FG = Finished Good, PKG = Packaging).
 * Each group can optionally belong to a stock category for deeper classification.
 *
 * The `superKey` is a business-facing sequential BIGINT for display/reference,
 * while `id` is the UUID used internally for all FK relationships.
 */
@Entity('stock_groups')
@Index('idx_stock_group_code', ['code'], { unique: true })
@Index('idx_stock_group_active', ['isActive'])
@Index('idx_stock_group_parent_cat', ['parentCategoryId'])
export class StockGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  @Column({ length: 100 })
  name!: string;

  /** Short identifier code (e.g. RM, FG, PKG) */
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  alias!: string | null;

  @Column({ name: 'parent_category_id', type: 'uuid', nullable: true })
  parentCategoryId!: string | null;

  @ManyToOne(() => StockCategory, { nullable: true })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory!: StockCategory | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;
}
