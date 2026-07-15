import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StorageUnitType {
  STORE = 'store',
  KITCHEN = 'kitchen',
  BAR = 'bar',
  COLD_STORAGE = 'cold_storage',
  OTHER = 'other',
}

@Entity('storage_units')
@Index('idx_storage_unit_code', ['code'], { unique: true })
@Index('idx_storage_unit_active', ['isActive'])
export class StorageUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50, unique: true })
  code!: string;

  @Column({
    type: 'enum',
    enum: StorageUnitType,
    name: 'storage_unit_type',
  })
  type!: StorageUnitType;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
