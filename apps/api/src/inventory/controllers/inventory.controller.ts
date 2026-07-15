import { Controller, Get, Post, Body, Param, Query, HttpCode } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { MovementType } from '../entities/inventory.entity';
import { BatchStatus } from '../entities/stock-batch.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.findAll(page, limit, search, status, storageUnitId);
  }

  @Get('low-stock')
  getLowStock(@Query('storageUnitId') storageUnitId?: string) {
    return this.service.getLowStock(storageUnitId);
  }

  @Get(':itemId')
  findByItem(@Param('itemId') itemId: string, @Query('storageUnitId') storageUnitId?: string) {
    return this.service.findByItem(itemId, storageUnitId);
  }

  // ── Opening stock routes (Module 3) ──────────────────────────

  @Post(':itemId/opening-stock')
  @HttpCode(201)
  declareOpeningStock(
    @Param('itemId') itemId: string,
    @Body('storageUnitId') storageUnitId: string,
    @Body('quantity') quantity: number,
    @Body('unitCost') unitCost: number,
    @Body('asOfDate') asOfDate?: string,
    @Body('createdBy') createdBy?: string,
  ) {
    return this.service.declareOpeningStock(
      itemId, storageUnitId, quantity, unitCost,
      asOfDate ? new Date(asOfDate) : undefined,
      createdBy,
    );
  }

  @Get(':itemId/opening-stock')
  getOpeningStock(
    @Param('itemId') itemId: string,
    @Query('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.getOpeningStockWithDetails(itemId, storageUnitId);
  }

  // ── Legacy route (deprecated) ────────────────────────────────

  @Post(':itemId/opening-balance')
  setOpeningBalance(
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
    @Body('unitCost') unitCost: number,
    @Body('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.setOpeningBalance(itemId, quantity, unitCost, storageUnitId);
  }

  @Post(':itemId/adjust')
  adjustStock(
    @Param('itemId') itemId: string,
    @Body('type') type: MovementType,
    @Body('quantity') quantity: number,
    @Body('notes') notes?: string,
    @Body('reference') reference?: string,
    @Body('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.adjustStock(itemId, type, quantity, notes, reference, storageUnitId);
  }

  @Post('transfer')
  transferStock(
    @Body('itemId') itemId: string,
    @Body('fromStorageUnitId') fromStorageUnitId: string,
    @Body('toStorageUnitId') toStorageUnitId: string,
    @Body('quantity') quantity: number,
    @Body('reference') reference?: string,
  ) {
    return this.service.transferStock(itemId, fromStorageUnitId, toStorageUnitId, quantity, reference);
  }

  @Get(':itemId/movements')
  getMovements(
    @Param('itemId') itemId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.getMovements(itemId, page, limit, storageUnitId);
  }

  @Get('valuation/summary')
  getInventoryValuation() {
    return this.service.getInventoryValuation();
  }

  // ── Batch tracking endpoints (Module 6) ──────────────────────

  @Get('batches/all')
  getAllBatches(@Query('storageUnitId') storageUnitId?: string) {
    return this.service.getAllBatches(storageUnitId);
  }

  @Get('near-expiry')
  getNearExpiryBatches(
    @Query('days') days: number = 7,
    @Query('storageUnitId') storageUnitId?: string,
  ) {
    return this.service.getNearExpiryBatches(days, storageUnitId);
  }

  @Get(':itemId/batches')
  getItemBatches(
    @Param('itemId') itemId: string,
    @Query('storageUnitId') storageUnitId?: string,
    @Query('status') status?: BatchStatus,
  ) {
    return this.service.getItemBatches(itemId, storageUnitId, status);
  }
}
