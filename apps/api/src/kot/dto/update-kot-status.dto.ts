import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KotStatus } from '../entities/kot.entity';

export class UpdateKotStatusDto {
  @IsEnum(KotStatus)
  status!: KotStatus;

  @IsString()
  @IsOptional()
  preparedBy?: string;
}
