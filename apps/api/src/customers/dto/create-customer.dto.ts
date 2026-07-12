import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';
import { CustomerType } from '../entities/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[\d\s-]{10,20}$/, { message: 'Phone must be a valid phone number' })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstin?: string;

  @IsOptional()
  @IsIn(['regular', 'corporate', 'staff'])
  customerType?: string;

  @IsOptional()
  @IsUUID()
  priceLevelId?: string;
}
