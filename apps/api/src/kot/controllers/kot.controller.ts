import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { KotService } from '../services/kot.service';
import { KotStatus, KotStation } from '../entities/kot.entity';

@Controller('kots')
export class KotController {
  constructor(private readonly service: KotService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string, @Query('station') station?: string) {
    return this.service.findAll(page, limit, status, station);
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
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: KotStatus) {
    return this.service.updateStatus(id, status);
  }

  @Patch(':kotId/items/:itemId/status')
  updateItemStatus(@Param('kotId') kotId: string, @Param('itemId') itemId: string, @Body('status') status: KotStatus) {
    return this.service.updateItemStatus(kotId, itemId, status);
  }
}
