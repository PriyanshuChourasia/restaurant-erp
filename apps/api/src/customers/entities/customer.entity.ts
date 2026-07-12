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
import { PriceLevel } from '../../price-levels/entities/price-level.entity';

export enum CustomerType {
  REGULAR = 'regular',
  CORPORATE = 'corporate',
  STAFF = 'staff',
}

@Entity('customers')
@Index('idx_customer_phone', ['phone'], { unique: true })
@Index('idx_customer_active', ['isActive'])
@Index('idx_customer_type', ['customerType'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 20, unique: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstin!: string | null;

  @Column({ type: 'varchar', length: 50, default: CustomerType.REGULAR, name: 'customer_type' })
  customerType!: string;

  @Column({ name: 'price_level_id', type: 'uuid', nullable: true })
  priceLevelId!: string | null;

  @ManyToOne(() => PriceLevel, { nullable: true })
  @JoinColumn({ name: 'price_level_id' })
  priceLevel!: PriceLevel | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
