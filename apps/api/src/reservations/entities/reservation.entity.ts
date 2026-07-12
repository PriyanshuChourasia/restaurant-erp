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
import { Table } from '../../seating/entities/table.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReservationSource {
  ONLINE = 'online',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
}

@Entity('reservations')
@Index('idx_reservation_status', ['status'])
@Index('idx_reservation_scheduled', ['scheduledFor'])
@Index('idx_reservation_table', ['tableId'])
@Index('idx_reservation_zone', ['zoneId'])
@Index('idx_reservation_customer_phone', ['customerPhone'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'customer_phone' })
  customerPhone!: string | null;

  @Column({ type: 'int', name: 'party_size' })
  partySize!: number;

  @Column({ name: 'zone_id', type: 'uuid', nullable: true })
  zoneId!: string | null;

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId!: string | null;

  @ManyToOne(() => Table, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'table_id' })
  table!: Table | null;

  @Column({ type: 'timestamp', name: 'scheduled_for' })
  scheduledFor!: Date;

  @Column({ type: 'int', name: 'duration_minutes', default: 90 })
  durationMinutes!: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({
    type: 'enum',
    enum: ReservationSource,
    default: ReservationSource.ONLINE,
    name: 'source',
  })
  source!: ReservationSource;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
