import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateItemSupplierDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  supplierSku?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

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

  @IsString()
  @IsOptional()
  notes?: string;
}
