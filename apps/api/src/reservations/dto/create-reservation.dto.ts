import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  IsIn,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ReservationStatus, ReservationSource } from '../entities/reservation.entity';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsInt()
  @Min(1)
  partySize!: number;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsDateString()
  scheduledFor!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsIn(['online', 'phone', 'walk_in'])
  source?: string;

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
