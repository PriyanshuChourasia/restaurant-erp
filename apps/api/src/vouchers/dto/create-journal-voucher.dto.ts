import {
  IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, ValidateNested, ArrayMinSize, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LedgerEntryType } from '../../ledger/entities/ledger.entity';

export class JournalVoucherLineDto {
  @IsUUID()
  accountId!: string;

  @IsEnum(LedgerEntryType)
  type!: LedgerEntryType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalVoucherDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => JournalVoucherLineDto)
  lines!: JournalVoucherLineDto[];

  @IsOptional()
  @IsString()
  narration?: string;

  @IsOptional()
  @IsDateString()
  voucherDate?: string;
}
