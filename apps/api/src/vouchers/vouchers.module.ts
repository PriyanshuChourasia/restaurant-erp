import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherType } from './entities/voucher-type.entity';
import { VoucherModuleEntity } from './entities/voucher-module.entity';
import { VouchersService } from './services/vouchers.service';
import { VouchersController } from './controllers/vouchers.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherType, VoucherModuleEntity]), LedgerModule],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
