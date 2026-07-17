import {
  IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, Max, MaxLength,
  ValidateNested, ArrayMinSize, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, FulfillmentMethod } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsUUID()
  itemId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;
}

export class CreateOrderDto {
  @IsEnum(OrderType)
  orderType!: OrderType;

  @IsOptional()
  @IsEnum(FulfillmentMethod)
  fulfillmentMethod?: FulfillmentMethod;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerGstin?: string;

  @IsOptional()
  @IsString({ each: true })
  tableIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  partySize?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
