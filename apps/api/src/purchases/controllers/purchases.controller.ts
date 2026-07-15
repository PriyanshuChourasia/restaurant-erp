import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode } from '@nestjs/common';
import { PurchasesService } from '../services/purchases.service';
import { PurchaseStatus } from '../entities/purchase.entity';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string, @Query('search') search?: string) {
    return this.service.findAll(page, limit, status, search);
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
  updateStatus(@Param('id') id: string, @Body('status') status: PurchaseStatus, @Body('userId') userId?: string) {
    return this.service.updateStatus(id, status, userId);
  }

  @Patch(':id/receive')
  @HttpCode(200)
  receive(@Param('id') id: string, @Body('userId') userId?: string) {
    return this.service.receive(id, userId);
  }
}
