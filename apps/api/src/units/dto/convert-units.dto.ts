import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ConvertUnitsDto {
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @IsOptional()
  @IsString()
  itemId?: string;
}
