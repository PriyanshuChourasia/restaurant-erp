import {
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FormatQuantityDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsIn(['full', 'compact', 'numeric'])
  @Type(() => String)
  variant?: 'full' | 'compact' | 'numeric';
}

export class FormatQuantityItemDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsString()
  unit: string;
}

export class FormatQuantityBatchDto {
  @IsOptional()
  @IsIn(['full', 'compact'])
  @Type(() => String)
  variant?: 'full' | 'compact';

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => FormatQuantityItemDto)
  items: FormatQuantityItemDto[];
}
