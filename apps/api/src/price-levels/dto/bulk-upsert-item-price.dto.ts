import { IsUUID, IsNumber, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemPriceEntryDto {
  @IsUUID()
  itemId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}

export class BulkUpsertItemPriceDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ItemPriceEntryDto)
  items!: ItemPriceEntryDto[];
}
