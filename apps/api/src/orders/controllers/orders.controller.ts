import { Controller, Get, Post, Patch, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderItemsDto } from '../dto/update-order-items.dto';
import { PaymentMethod } from '../../sales/entities/sales.entity';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @Permissions('orders.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('orderType') orderType?: string,
  ) {
    return this.service.findAll(page, limit, status, orderType);
  }

  @Get(':id')
  @Permissions('orders.read')
  findOne(@Param('id') id: string) {
    return this.service.findByIdWithFlags(id);
  }

  @Post()
  @Permissions('orders.create')
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id/items')
  @Permissions('orders.update')
  updateItems(@Param('id') id: string, @Body(new ValidationPipe({ transform: true })) dto: UpdateOrderItemsDto) {
    return this.service.updateItems(id, dto.items);
  }

  @Post(':id/confirm')
  @Permissions('orders.update')
  confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }

  @Post(':id/send-to-kitchen')
  @Permissions('orders.update')
  sendToKitchen(@Param('id') id: string) {
    return this.service.sendToKitchen(id);
  }

  @Post(':id/charge')
  @Permissions('orders.charge')
  charge(@Param('id') id: string, @Body('paymentMethod') paymentMethod: PaymentMethod) {
    return this.service.charge(id, paymentMethod);
  }

  @Post(':id/cancel')
  @Permissions('orders.cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
