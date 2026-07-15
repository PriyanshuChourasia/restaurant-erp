import { Controller, Get, Post, Body, Param, Query, HttpCode } from '@nestjs/common';
import { StockCountService } from '../services/stock-count.service';

@Controller('inventory/stock-counts')
export class StockCountController {
  constructor(private readonly service: StockCountService) {}

  @Post()
  @HttpCode(201)
  create(
    @Body('storageUnitId') storageUnitId: string,
    @Body('itemIds') itemIds: string[],
    @Body('countDate') countDate?: string,
    @Body('notes') notes?: string,
    @Body('createdBy') createdBy?: string,
  ) {
    return this.service.create(
      storageUnitId,
      itemIds,
      createdBy,
      countDate ? new Date(countDate) : undefined,
      notes,
    );
  }

  @Post(':id/submit')
  submitCounts(
    @Param('id') id: string,
    @Body('lines') lines: { lineId: string; countedQuantity: number; notes?: string }[],
  ) {
    return this.service.submitCounts(id, lines);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body('createdBy') createdBy?: string,
  ) {
    return this.service.complete(id, createdBy);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.findAll(page, limit, storageUnitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
