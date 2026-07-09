import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LedgerService } from '../services/ledger.service';
import { LedgerEntryType, LedgerCategory } from '../entities/ledger.entity';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly service: LedgerService) {}

  @Get('accounts')
  getAccounts() {
    return this.service.getAccounts();
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string) {
    return this.service.getAccount(id);
  }

  @Post('accounts')
  createAccount(@Body() dto: any) {
    return this.service.createAccount(dto);
  }

  @Post('accounts/:id/opening-balance')
  setOpeningBalance(@Param('id') id: string, @Body('amount') amount: number, @Body('financialYear') financialYear?: string) {
    return this.service.setOpeningBalance(id, amount, financialYear);
  }

  @Get('accounts/:id/entries')
  getEntries(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getEntries(id, page, limit);
  }

  @Post('entries')
  addEntry(@Body() dto: any) {
    return this.service.addEntry(dto);
  }

  @Get('balance-sheet')
  getBalanceSheet() {
    return this.service.getBalanceSheet();
  }
}
