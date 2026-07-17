import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateKotItemAvailabilityDto {
  @IsBoolean()
  isUnavailable!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
