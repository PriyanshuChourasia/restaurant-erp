import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ValidationPipe,
} from '@nestjs/common';
import { ZonesService } from '../services/zones.service';
import { TablesService } from '../services/tables.service';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';

@Controller('zones')
export class ZonesController {
  constructor(
    private readonly zonesService: ZonesService,
    private readonly tablesService: TablesService,
  ) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.zonesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Get(':id/tables')
  getTables(@Param('id') id: string) {
    return this.tablesService.findByZone(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true })) dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zonesService.remove(id);
  }
}
