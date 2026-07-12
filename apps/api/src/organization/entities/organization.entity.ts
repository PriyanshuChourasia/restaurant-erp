import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('organization_settings')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, default: 'My Restaurant' })
  restaurantName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tagline!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstin!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'fssai_license' })
  fssaiLicense!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 5, default: '₹' })
  currencySymbol!: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({ type: 'varchar', length: 20, default: 'GST' })
  taxLabel!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, transformer: decimalTransformer })
  defaultTaxRate!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'service_charge_percent', transformer: decimalTransformer })
  serviceChargePercent!: number;

  @Column({ type: 'simple-json', nullable: true, name: 'business_hours' })
  businessHours!: Record<string, { open: string; close: string; isClosed: boolean }> | null;

  @Column({ type: 'text', nullable: true, name: 'invoice_footer' })
  invoiceFooter!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
