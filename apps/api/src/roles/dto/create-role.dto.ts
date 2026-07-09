import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  @ArrayMaxSize(100)
  permissionIds?: string[];
}
