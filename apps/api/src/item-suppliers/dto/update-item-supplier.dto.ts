import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
  Length,
} from 'class-validator';

export class UpdateItemSupplierDto {
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  supplierSku?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  minOrderQty?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
