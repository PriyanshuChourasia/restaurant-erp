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

export enum GstRate {
  NIL = 0,
  FIVE = 5,
  TWELVE = 12,
  EIGHTEEN = 18,
  TWENTY_EIGHT = 28,
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

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_price', default: 0 })
  costPrice!: number;

  @Column({
    type: 'enum',
    enum: GstRate,
    default: GstRate.EIGHTEEN,
  })
  gstRate!: GstRate;

  @Column({
    type: 'enum',
    enum: ItemUnit,
    default: ItemUnit.PIECE,
  })
  unit!: ItemUnit;

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
