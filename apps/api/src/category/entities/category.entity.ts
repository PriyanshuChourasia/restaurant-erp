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
  VersionColumn,
} from 'typeorm';

@Entity('categories')
@Index('idx_category_path', ['path'])
@Index('idx_category_parent_id', ['parentId'])
@Index('idx_category_is_active', ['isActive'])
@Index('idx_category_display_order', ['displayOrder'])
@Index('idx_category_level', ['level'])
@Index('idx_category_slug', ['slug'], { unique: true })
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 255 })
  slug!: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: CategoryEntity | null;

  @Column({ type: 'text', default: '' })
  path!: string;

  @Column({ default: 0 })
  level!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  // Optimistic Locking
  @VersionColumn({ default: 1 })
  version!: number;

  // Audit columns
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
