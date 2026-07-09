import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount, LedgerEntry } from './entities/ledger.entity';
import { LedgerService } from './services/ledger.service';
import { LedgerController } from './controllers/ledger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerAccount, LedgerEntry])],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
