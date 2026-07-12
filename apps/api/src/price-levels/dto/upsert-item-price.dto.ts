import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

export class UpsertItemPriceDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  @IsOptional()
  priceLevelId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}
