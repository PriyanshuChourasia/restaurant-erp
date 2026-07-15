import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { StorageUnitsService } from '../services/storage-units.service';
import { StorageUnitType } from '../entities/storage-unit.entity';

class CreateStorageUnitDto {
  @IsString() name!: string;
  @IsString() code!: string;
  @IsEnum(StorageUnitType) type!: StorageUnitType;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

class UpdateStorageUnitDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsEnum(StorageUnitType) type?: StorageUnitType;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('storage-units')
export class StorageUnitsController {
  constructor(private readonly storageUnitsService: StorageUnitsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.storageUnitsService.findAll(includeInactive === 'true');
  }

  @Get('default')
  findDefault() {
    return this.storageUnitsService.findDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storageUnitsService.findById(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateStorageUnitDto) {
    return this.storageUnitsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateStorageUnitDto,
  ) {
    return this.storageUnitsService.update(id, dto);
  }

  @Patch(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.storageUnitsService.setDefault(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storageUnitsService.remove(id);
  }
}
