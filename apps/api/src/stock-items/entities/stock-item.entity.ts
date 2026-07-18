import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UnitOfMeasure } from '../../units/entities/unit-of-measure.entity';
import { StockGroup } from '../../inventory/entities/stock-group.entity';
import { StockCategory } from '../../inventory/entities/stock-category.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

export enum GstRate {
  NIL = 0,
  FIVE = 5,
  TWELVE = 12,
  EIGHTEEN = 18,
  TWENTY_EIGHT = 28,
}

export enum ItemType {
  GOODS = 'goods',
  SERVICE = 'service',
}

/** Used by the Recipes module for yield/ingredient unit columns. */
export enum ItemUnit {
  PIECE = 'piece',
  KG = 'kg',
  GRAM = 'gram',
  LITRE = 'litre',
  ML = 'ml',
  DOZEN = 'dozen',
  PLATE = 'plate',
  BOWL = 'bowl',
  CUP = 'cup',
  GLASS = 'glass',
  BOTTLE = 'bottle',
  BOX = 'box',
  PACKET = 'packet',
}

export enum ProductType {
  RAW = 'raw',
  SEMI_FINISHED = 'semi_finished',
  FINISHED = 'finished',
  TRADING = 'trading',
  PACKAGING = 'packaging',
  CONSUMABLE = 'consumable',
  SERVICE = 'service',
}

/**
 * Stock Items — the single master for everything the business buys, stocks, or sells
 * (menu items, raw materials, packaging). Combines sale-side data (price, GST, veg flag)
 * with inventory-side data (stock group/category classification, opening balance, reorder
 * level, batch/expiry tracking).
 */
@Entity('stock_items')
@Index('idx_stock_item_sku', ['sku'], { unique: true })
@Index('idx_stock_item_category', ['categoryId'])
@Index('idx_stock_item_active', ['isActive'])
@Index('idx_stock_item_hsn', ['hsnCode'])
@Index('idx_stock_item_stock_group', ['stockGroupId'])
@Index('idx_stock_item_stock_category', ['stockCategoryId'])
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  alias!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 100, unique: true })
  sku!: string;

  @Column({ name: 'hsn_code', length: 20 })
  hsnCode!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  price!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_price', default: 0, transformer: decimalTransformer })
  costPrice!: number;

  @Column({
    type: 'enum',
    enum: GstRate,
    name: 'gst_rate',
    default: GstRate.EIGHTEEN,
  })
  gstRate!: GstRate;

  @Column({
    type: 'enum',
    enum: ItemType,
    name: 'item_type',
    default: ItemType.GOODS,
  })
  itemType!: ItemType;

  @Column({ name: 'is_taxable', default: true })
  isTaxable!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'cess_percent', default: 0, transformer: decimalTransformer })
  cessPercent!: number;

  @Column({ name: 'reverse_charge', default: false })
  reverseCharge!: boolean;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitOfMeasure;

  @Column({ name: 'purchase_unit_id', type: 'uuid', nullable: true })
  purchaseUnitId!: string | null;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'purchase_unit_id' })
  purchaseUnit!: UnitOfMeasure | null;

  @Column({ name: 'shelf_life_days', type: 'int', nullable: true })
  shelfLifeDays!: number | null;

  @Column({
    type: 'enum',
    enum: ProductType,
    name: 'product_type',
    default: ProductType.FINISHED,
  })
  productType!: ProductType;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_veg', default: true })
  isVeg!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryEntity | null;

  // ── Inventory classification ─────────────────────────────────

  @Column({ name: 'stock_group_id', type: 'uuid', nullable: true })
  stockGroupId!: string | null;

  @ManyToOne(() => StockGroup, { nullable: true })
  @JoinColumn({ name: 'stock_group_id' })
  stockGroup!: StockGroup | null;

  @Column({ name: 'stock_category_id', type: 'uuid', nullable: true })
  stockCategoryId!: string | null;

  @ManyToOne(() => StockCategory, { nullable: true })
  @JoinColumn({ name: 'stock_category_id' })
  stockCategory!: StockCategory | null;

  // ── Opening balance & reorder ────────────────────────────────

  @Column({
    type: 'decimal', precision: 18, scale: 3,
    name: 'opening_quantity', nullable: true,
    transformer: decimalTransformer,
  })
  openingQuantity!: number | null;

  @Column({
    type: 'decimal', precision: 18, scale: 2,
    name: 'opening_rate', nullable: true,
    transformer: decimalTransformer,
  })
  openingRate!: number | null;

  /** Reorder level — when stock falls below this, trigger a purchase order. */
  @Column({
    type: 'decimal', precision: 18, scale: 3,
    name: 'reorder_level', nullable: true,
    transformer: decimalTransformer,
  })
  reorderLevel!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode!: string | null;

  @Column({ name: 'track_batch', default: false })
  trackBatch!: boolean;

  @Column({ name: 'track_expiry', default: false })
  trackExpiry!: boolean;

  // ── Timestamps & audit ───────────────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;
}
