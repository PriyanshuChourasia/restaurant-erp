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

/**
 * Stock Categories — a hierarchical taxonomy for categorising stock items within
 * a stock group (e.g. "Grains & Cereals" under RM, "Spices" under RM, "Beverages" under FG).
 * Each category can have a parent category for nested classification.
 *
 * The `superKey` is a business-facing sequential BIGINT (auto-increment) for display/reference
 * purposes, while `id` is the UUID used internally for all FK relationships.
 */
@Entity('stock_categories')
@Index('idx_stock_cat_super_key', ['superKey'], { unique: true })
@Index('idx_stock_cat_active', ['isActive'])
@Index('idx_stock_cat_parent', ['parentCategoryId'])
export class StockCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  alias!: string | null;

  @Column({ name: 'parent_category_id', type: 'uuid', nullable: true })
  parentCategoryId!: string | null;

  @ManyToOne(() => StockCategory, { nullable: true })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory!: StockCategory | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

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
