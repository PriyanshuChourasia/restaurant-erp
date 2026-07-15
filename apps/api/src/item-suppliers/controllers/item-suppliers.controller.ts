import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ItemSuppliersService } from '../services/item-suppliers.service';
import { CreateItemSupplierDto } from '../dto/create-item-supplier.dto';
import { UpdateItemSupplierDto } from '../dto/update-item-supplier.dto';

@Controller('item-suppliers')
export class ItemSuppliersController {
  constructor(private readonly service: ItemSuppliersService) {}

  @Get('item/:itemId')
  findByItem(@Param('itemId') itemId: string) {
    return this.service.findByItem(itemId);
  }

  @Get('supplier/:supplierId')
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(supplierId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateItemSupplierDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemSupplierDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('set-preferred/:itemId/:supplierId')
  setPreferred(
    @Param('itemId') itemId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.service.setPreferred(itemId, supplierId);
  }
}
