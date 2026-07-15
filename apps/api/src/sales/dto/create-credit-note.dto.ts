import {
  IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsBoolean, Min, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/sales.entity';

export class CreditNoteLineDto {
  @IsUUID()
  invoiceItemId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;

  @IsBoolean()
  restoreStock!: boolean;
}

export class ReplacementItemDto {
  @IsUUID()
  itemId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;
}

export class CreateCreditNoteDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreditNoteLineDto)
  items!: CreditNoteLineDto[];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReplacementItemDto)
  replacementItems?: ReplacementItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
