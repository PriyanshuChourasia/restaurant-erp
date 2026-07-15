import {
  IsString, IsOptional, IsUUID, IsNumber, Min, MaxLength, ValidateNested, ArrayMinSize, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherLineDto } from './create-payment-voucher.dto';

export class CreateReceiptVoucherDto {
  @IsString()
  @MaxLength(20)
  paymentMode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => VoucherLineDto)
  creditLines!: VoucherLineDto[];

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

  @IsOptional()
  @IsUUID()
  referenceInvoiceId?: string;
}
