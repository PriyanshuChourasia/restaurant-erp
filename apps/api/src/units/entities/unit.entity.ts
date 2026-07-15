import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UnitType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  COUNT = 'count',
}

@Entity('units')
@Index('idx_unit_code', ['code'], { unique: true })
@Index('idx_unit_type', ['unitType'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: UnitType,
    name: 'unit_type',
  })
  unitType!: UnitType;

  @Column({ name: 'is_base_unit', default: false })
  isBaseUnit!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
