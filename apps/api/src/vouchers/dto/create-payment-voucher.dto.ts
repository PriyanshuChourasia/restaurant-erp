import {
  IsString, IsOptional, IsUUID, IsNumber, Min, MaxLength, ValidateNested, ArrayMinSize, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VoucherLineDto {
  @IsUUID()
  accountId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePaymentVoucherDto {
  @IsString()
  @MaxLength(20)
  paymentMode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => VoucherLineDto)
  debitLines!: VoucherLineDto[];

  @IsOptional()
  @IsString()
  narration?: string;

  @IsOptional()
  @IsDateString()
  voucherDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  partyType?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;
}
