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
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

/**
 * Units of Measure — a redesigned UOM table replacing the old concept.
 * Each unit can reference a base unit (e.g. Gram → Kilogram) with a conversion
 * factor for automatic unit conversion.
 *
 * The `superKey` is a business-facing sequential BIGINT for display/reference,
 * while `id` is the UUID used internally for all FK relationships.
 */
@Entity('unit_of_measures')
@Index('idx_uom_symbol', ['symbol'], { unique: true })
@Index('idx_uom_active', ['isActive'])
@Index('idx_uom_base', ['baseUnitId'])
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Business-facing sequential ID for display/reference */
  @Column({ type: 'bigint', name: 'super_key', unique: true })
  @Generated('increment')
  superKey!: number;

  @Column({ length: 50 })
  name!: string;

  /** Short symbol/code for the unit (e.g. kg, g, L, ml, pcs) */
  @Column({ length: 10, unique: true })
  symbol!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Reference to the base unit for conversion (e.g. Gram → Kilogram) */
  @Column({ name: 'base_unit_id', type: 'uuid', nullable: true })
  baseUnitId!: string | null;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'base_unit_id' })
  baseUnit!: UnitOfMeasure | null;

  /** Conversion factor from this unit TO the base unit (e.g. 1000 grams = 1 kg) */
  @Column({
    type: 'decimal', precision: 18, scale: 6,
    name: 'conversion_factor', default: 1,
    transformer: decimalTransformer,
  })
  conversionFactor!: number;

  /** Whether decimal quantities are allowed for this unit */
  @Column({ name: 'decimal_allowed', default: true })
  decimalAllowed!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
