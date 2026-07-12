import { Controller, Get, Post, Patch, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceStatus } from '../entities/sales.entity';

@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.findAll(page, limit, status, search, fromDate, toDate);
  }

  @Get('daily')
  getDailySales(@Query('date') date?: string) {
    return this.service.getDailySales(date);
  }

  @Get('reports/sales')
  getSalesReport(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.service.getSalesReport(fromDate, toDate);
  }

  @Get('reports/gst')
  getGstReport(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.service.getGstReport(fromDate, toDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: InvoiceStatus) {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/clear-tables')
  clearTables(@Param('id') id: string) {
    return this.service.clearTables(id);
  }
}
