import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { PermissionModule } from '../enums/permission-module.enum';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsString()
  @IsNotEmpty()
  module: PermissionModule;
}
