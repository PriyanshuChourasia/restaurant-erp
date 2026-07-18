import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DocumentLink } from './document-link.entity';

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PURCHASE_ORDER = 'purchase_order',
  DELIVERY_NOTE = 'delivery_note',
  QUOTATION = 'quotation',
  CONTRACT = 'contract',
  LICENSE = 'license',
  CERTIFICATE = 'certificate',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  documentNumber!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type!: DocumentType;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status!: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'int', nullable: true })
  fileSize!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  linkedEntityType!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  linkedEntityId!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: User | null;

  @OneToMany(() => DocumentLink, (link) => link.document, { cascade: true })
  links!: DocumentLink[];

  @Column({ type: 'date', nullable: true })
  documentDate!: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
