import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { KotStation } from '../entities/kot.entity';

export class CreateKotItemDto {
  @IsString()
  itemId!: string;

  @IsString()
  itemName!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateKotDto {
  @IsString()
  @IsOptional()
  orderId?: string;

  @IsArray()
  @IsOptional()
  tableIds?: string[];

  @IsEnum(KotStation)
  station!: KotStation;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  preparedBy?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateKotItemDto)
  items!: CreateKotItemDto[];
}
