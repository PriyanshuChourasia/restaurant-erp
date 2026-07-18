import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { StockItemsService } from '../services/stock-items.service';
import { CreateStockItemDto } from '../dto/create-stock-item.dto';
import { UpdateStockItemDto } from '../dto/update-stock-item.dto';
import { QueryStockItemDto } from '../dto/query-stock-item.dto';

@Controller('stock-items')
export class StockItemsController {
  constructor(private readonly stockItemsService: StockItemsService) {}

  @Get()
  findAll(@Query() query: QueryStockItemDto) {
    return this.stockItemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockItemsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateStockItemDto) {
    return this.stockItemsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStockItemDto) {
    return this.stockItemsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockItemsService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.stockItemsService.restore(id);
  }
}
