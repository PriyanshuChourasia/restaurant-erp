import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsNotEmpty()
  @IsIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
  status!: string;
}
