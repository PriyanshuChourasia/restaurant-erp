import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  Length,
} from 'class-validator';
import { GstRate, ProductType, ItemType } from '../entities/stock-item.entity';

export class CreateStockItemDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsOptional()
  @Length(1, 150)
  alias?: string;

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

  @IsEnum(ItemType)
  @IsOptional()
  itemType?: ItemType;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  cessPercent?: number;

  @IsBoolean()
  @IsOptional()
  reverseCharge?: boolean;

  @IsUUID()
  @IsNotEmpty()
  unitId!: string;

  @IsUUID()
  @IsOptional()
  purchaseUnitId?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  shelfLifeDays?: number;

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

  @IsUUID()
  @IsOptional()
  stockGroupId?: string;

  @IsUUID()
  @IsOptional()
  stockCategoryId?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  openingQuantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  openingRate?: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  barcode?: string;

  @IsBoolean()
  @IsOptional()
  trackBatch?: boolean;

  @IsBoolean()
  @IsOptional()
  trackExpiry?: boolean;
}
