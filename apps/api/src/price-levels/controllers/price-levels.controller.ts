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
import { PriceLevelsService } from '../services/price-levels.service';
import { CreatePriceLevelDto } from '../dto/create-price-level.dto';
import { UpdatePriceLevelDto } from '../dto/update-price-level.dto';
import { QueryPriceLevelDto } from '../dto/query-price-level.dto';
import { BulkUpsertItemPriceDto } from '../dto/bulk-upsert-item-price.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@Controller('price-levels')
export class PriceLevelsController {
  constructor(private readonly priceLevelsService: PriceLevelsService) {}

  // ───── CRUD ─────

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryPriceLevelDto) {
    return this.priceLevelsService.findAll(query);
  }

  @Get('active')
  findAllActive() {
    return this.priceLevelsService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceLevelsService.findOne(id);
  }

  @Post()
  @Permissions('pricing.create')
  create(@Body(new ValidationPipe({ transform: true })) dto: CreatePriceLevelDto) {
    return this.priceLevelsService.create(dto);
  }

  @Patch(':id')
  @Permissions('pricing.update')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePriceLevelDto,
  ) {
    return this.priceLevelsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('pricing.delete')
  remove(@Param('id') id: string) {
    return this.priceLevelsService.remove(id);
  }

  @Post(':id/restore')
  @Permissions('pricing.update')
  restore(@Param('id') id: string) {
    return this.priceLevelsService.restore(id);
  }

  // ───── Actions ─────

  @Patch(':id/activate')
  @Permissions('pricing.update')
  activate(@Param('id') id: string) {
    return this.priceLevelsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('pricing.update')
  deactivate(@Param('id') id: string) {
    return this.priceLevelsService.deactivate(id);
  }

  @Patch(':id/set-default')
  @Permissions('pricing.update')
  setDefault(@Param('id') id: string) {
    return this.priceLevelsService.setDefault(id);
  }

  // ───── Pricing Grid ─────

  @Get(':id/pricing-grid')
  getPricingGrid(@Param('id') id: string) {
    return this.priceLevelsService.getPricingGrid(id);
  }

  @Post(':id/pricing-grid')
  @Permissions('pricing.update')
  savePricingGrid(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: BulkUpsertItemPriceDto,
  ) {
    return this.priceLevelsService.bulkUpsertItemPrices(id, dto);
  }

  // ───── Effective Price ─────

  @Get(':priceLevelId/items/:itemId/effective-price')
  getEffectivePrice(
    @Param('priceLevelId') priceLevelId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.priceLevelsService.getEffectivePrice(itemId, priceLevelId);
  }
}
