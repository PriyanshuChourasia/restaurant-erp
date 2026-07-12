import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsArray,
  ValidateNested, Min, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemUnit } from '../../items/entities/item.entity';

export class RecipeIngredientEntryDto {
  @IsUUID()
  @IsNotEmpty()
  componentItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsEnum(ItemUnit)
  unit: ItemUnit;
}

export class CreateRecipeDto {
  @IsUUID()
  @IsNotEmpty()
  outputItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  yieldQuantity: number;

  @IsEnum(ItemUnit)
  yieldUnit: ItemUnit;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientEntryDto)
  ingredients: RecipeIngredientEntryDto[];
}

export class CreateProductionEntryDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  batchQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
