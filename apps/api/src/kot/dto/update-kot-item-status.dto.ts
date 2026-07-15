import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KotStatus } from '../entities/kot.entity';

export class UpdateKotItemStatusDto {
  @IsEnum(KotStatus)
  status!: KotStatus;

  @IsString()
  @IsOptional()
  preparedBy?: string;
}
