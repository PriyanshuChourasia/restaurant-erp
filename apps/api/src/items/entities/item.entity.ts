import {
  Entity,
  PrimaryGeneratedColumn,
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

// Kept as string constants for backward compatibility during migration;
// new code should reference Unit entities from the 'units' table instead.

export enum ProductType {
  RAW = 'raw',
  SEMI_FINISHED = 'semi_finished',
  FINISHED = 'finished',
  TRADING = 'trading',
  PACKAGING = 'packaging',
  CONSUMABLE = 'consumable',
  SERVICE = 'service',
}

@Entity('items')
@Index('idx_item_category', ['categoryId'])
@Index('idx_item_active', ['isActive'])
@Index('idx_item_hsn', ['hsnCode'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
