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
import { Unit } from './unit.entity';
import { Item } from '../../items/entities/item.entity';

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

  @ManyToOne(() => Item, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item | null;

  @Column({ name: 'from_unit_id', type: 'uuid' })
  fromUnitId!: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'from_unit_id' })
  fromUnit!: Unit;

  @Column({ name: 'to_unit_id', type: 'uuid' })
  toUnitId!: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'to_unit_id' })
  toUnit!: Unit;

  @Column({ type: 'decimal', precision: 14, scale: 6 })
  factor!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
