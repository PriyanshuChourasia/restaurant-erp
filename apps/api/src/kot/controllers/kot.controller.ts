import { Controller, Get, Post, Patch, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { KotService } from '../services/kot.service';
import { KotStatus, KotStation } from '../entities/kot.entity';
import { CreateKotDto } from '../dto/create-kot.dto';
import { UpdateKotStatusDto } from '../dto/update-kot-status.dto';
import { UpdateKotItemStatusDto } from '../dto/update-kot-item-status.dto';
import { KotQueryDto } from '../dto/kot-query.dto';

@Controller('kots')
export class KotController {
  constructor(private readonly service: KotService) {}

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true, whitelist: true })) query: KotQueryDto) {
    return this.service.findAll(query.page, query.limit, query.status, query.station);
  }

  @Get('active')
  getActive(@Query('station') station?: string) {
    return this.service.getActiveKots(station);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateKotDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateKotStatusDto) {
    return this.service.updateStatus(id, dto.status, dto.preparedBy);
  }

  @Patch(':kotId/items/:itemId/status')
  updateItemStatus(
    @Param('kotId') kotId: string,
    @Param('itemId') itemId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateKotItemStatusDto,
  ) {
    return this.service.updateItemStatus(kotId, itemId, dto.status, dto.preparedBy);
  }
}
