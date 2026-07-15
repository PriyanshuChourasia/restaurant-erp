import { Controller, Get, Post, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { VouchersService } from '../services/vouchers.service';
import { CreatePaymentVoucherDto } from '../dto/create-payment-voucher.dto';
import { CreateReceiptVoucherDto } from '../dto/create-receipt-voucher.dto';
import { CreateJournalVoucherDto } from '../dto/create-journal-voucher.dto';
import { VoucherType, VoucherStatus } from '../entities/voucher.entity';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly service: VouchersService) {}

  @Get()
  @Permissions('vouchers.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('voucherType') voucherType?: VoucherType,
    @Query('status') status?: VoucherStatus,
  ) {
    return this.service.findAll(page, limit, voucherType, status);
  }

  @Get(':id')
  @Permissions('vouchers.read')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post('payment')
  @Permissions('vouchers.create')
  createPayment(@Body(new ValidationPipe({ transform: true })) dto: CreatePaymentVoucherDto) {
    return this.service.createPaymentVoucher(dto);
  }

  @Post('receipt')
  @Permissions('vouchers.create')
  createReceipt(@Body(new ValidationPipe({ transform: true })) dto: CreateReceiptVoucherDto) {
    return this.service.createReceiptVoucher(dto);
  }

  @Post('journal')
  @Permissions('vouchers.create')
  createJournal(@Body(new ValidationPipe({ transform: true })) dto: CreateJournalVoucherDto) {
    return this.service.createJournalVoucher(dto);
  }

  @Post(':id/cancel')
  @Permissions('vouchers.cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancelVoucher(id);
  }
}
