import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { AccountNature } from './account-nature.entity';

@Entity('account_groups')
@Index('idx_account_group_nature', ['natureId'])
export class AccountGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 20, unique: true })
  code!: string;

  @Column({ name: 'nature_id', type: 'uuid' })
  natureId!: string;

  @ManyToOne(() => AccountNature)
  @JoinColumn({ name: 'nature_id' })
  nature!: AccountNature;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
