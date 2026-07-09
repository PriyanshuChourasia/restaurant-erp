import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { MovementType } from '../entities/inventory.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string, @Query('status') status?: string) {
    return this.service.findAll(page, limit, search, status);
  }

  @Get('low-stock')
  getLowStock() {
    return this.service.getLowStock();
  }

  @Get(':itemId')
  findByItem(@Param('itemId') itemId: string) {
    return this.service.findByItem(itemId);
  }

  @Post(':itemId/opening-balance')
  setOpeningBalance(@Param('itemId') itemId: string, @Body('quantity') quantity: number, @Body('unitCost') unitCost: number) {
    return this.service.setOpeningBalance(itemId, quantity, unitCost);
  }

  @Post(':itemId/adjust')
  adjustStock(
    @Param('itemId') itemId: string,
    @Body('type') type: MovementType,
    @Body('quantity') quantity: number,
    @Body('notes') notes?: string,
    @Body('reference') reference?: string,
  ) {
    return this.service.adjustStock(itemId, type, quantity, notes, reference);
  }

  @Get(':itemId/movements')
  getMovements(@Param('itemId') itemId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getMovements(itemId, page, limit);
  }
}
