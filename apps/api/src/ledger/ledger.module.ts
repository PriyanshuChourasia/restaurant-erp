import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount, LedgerEntry } from './entities/ledger.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { LedgerService } from './services/ledger.service';
import { JournalService } from './services/journal.service';
import { LedgerController } from './controllers/ledger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerAccount, LedgerEntry, JournalEntry])],
  controllers: [LedgerController],
  providers: [LedgerService, JournalService],
  exports: [LedgerService, JournalService],
})
export class LedgerModule {}
