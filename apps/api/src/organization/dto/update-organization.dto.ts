import {
  IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min, Max,
} from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  restaurantName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstin?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fssaiLicense?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxLabel?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultTaxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceChargePercent?: number;

  @IsOptional()
  businessHours?: Record<string, { open: string; close: string; isClosed: boolean }> | null;

  @IsOptional()
  @IsString()
  invoiceFooter?: string | null;
}
