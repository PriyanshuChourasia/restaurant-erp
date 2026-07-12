import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID, IsNumber, IsIn, Min } from 'class-validator';
import { TableCategory } from '../entities/table.entity';

export class CreateTableDto {
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(['online', 'walk_in', 'flexible'])
  category?: string;

  @IsOptional()
  @IsIn(['available', 'booked', 'occupied'])
  status?: string;

  @IsOptional()
  @IsNumber()
  posX?: number;

  @IsOptional()
  @IsNumber()
  posY?: number;

  @IsOptional()
  isActive?: boolean;
}
