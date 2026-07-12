import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsUUID,
  Length,
} from 'class-validator';
import { GstRate, ItemUnit, ProductType } from '../entities/item.entity';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  hsnCode: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsEnum(GstRate)
  @IsOptional()
  gstRate?: GstRate;

  @IsEnum(ItemUnit)
  @IsOptional()
  unit?: ItemUnit;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVeg?: boolean;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
