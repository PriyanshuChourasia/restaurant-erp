import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { StockItem } from '../../stock-items/entities/stock-item.entity';

@Entity('unit_conversions')
@Unique(['itemId', 'fromUnitId', 'toUnitId'])
@Index('idx_conversion_from', ['fromUnitId'])
@Index('idx_conversion_to', ['toUnitId'])
@Index('idx_conversion_item', ['itemId'])
export class UnitConversion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id', type: 'uuid', nullable: true })
  itemId!: string | null;

  @ManyToOne(() => StockItem, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: StockItem | null;

  @Column({ name: 'from_unit_id', type: 'uuid' })
  fromUnitId!: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'from_unit_id' })
  fromUnit!: UnitOfMeasure;

  @Column({ name: 'to_unit_id', type: 'uuid' })
  toUnitId!: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'to_unit_id' })
  toUnit!: UnitOfMeasure;

  @Column({ type: 'decimal', precision: 14, scale: 6 })
  factor!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
