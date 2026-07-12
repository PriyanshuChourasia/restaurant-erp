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
import { Zone } from './zone.entity';

export enum TableCategory {
  ONLINE = 'online',
  WALK_IN = 'walk_in',
  FLEXIBLE = 'flexible',
}

export enum TableStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  OCCUPIED = 'occupied',
}

@Entity('tables')
@Index('idx_table_zone_label', ['zoneId', 'label'], { unique: true })
@Index('idx_table_zone', ['zoneId'])
@Index('idx_table_status', ['status'])
@Index('idx_table_active', ['isActive'])
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'zone_id', type: 'uuid', nullable: true })
  zoneId!: string | null;

  @ManyToOne(() => Zone, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'zone_id' })
  zone!: Zone | null;

  @Column({ length: 100 })
  label!: string;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ type: 'varchar', length: 50, default: TableCategory.WALK_IN })
  category!: string;

  @Column({ type: 'varchar', length: 50, default: TableStatus.AVAILABLE })
  status!: string;

  @Column({ name: 'pos_x', type: 'float', nullable: true })
  posX!: number | null;

  @Column({ name: 'pos_y', type: 'float', nullable: true })
  posY!: number | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
