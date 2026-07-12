import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateTableStatusDto {
  @IsNotEmpty()
  @IsIn(['available', 'booked', 'occupied'])
  status!: string;
}
