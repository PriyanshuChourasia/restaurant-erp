import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JournalEntry, JournalSourceType } from '../entities/journal-entry.entity';
import { LedgerEntry, LedgerEntryType, LedgerCategory } from '../entities/ledger.entity';
import { LedgerService } from './ledger.service';

export interface JournalLineInput {
  accountId: string;
  type: LedgerEntryType;
  amount: number;
  description?: string;
  category?: LedgerCategory;
}

export interface PostJournalDto {
  date?: string;
  narration?: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  reversalOfId?: string;
  reference?: string;
  lines: JournalLineInput[];
  createdBy?: string;
}

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly journalRepo: Repository<JournalEntry>,
    private readonly ledgerService: LedgerService,
    private readonly dataSource: DataSource,
  ) {}

  async post(dto: PostJournalDto): Promise<JournalEntry> {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A journal entry needs at least two lines');
    }
    const totalDebit = dto.lines
      .filter((l) => l.type === LedgerEntryType.DEBIT)
      .reduce((s, l) => s + l.amount, 0);
    const totalCredit = dto.lines
      .filter((l) => l.type === LedgerEntryType.CREDIT)
      .reduce((s, l) => s + l.amount, 0);
    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
      throw new BadRequestException(
        `Journal entry is not balanced: debit ${totalDebit.toFixed(2)} != credit ${totalCredit.toFixed(2)}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(JournalEntry);
      const count = await journalRepo.count();
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;
      const entryDate = dto.date ? new Date(dto.date) : new Date();

      const journalEntry = await journalRepo.save(journalRepo.create({
        entryNumber,
        entryDate,
        narration: dto.narration || null,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId || null,
        reversalOfId: dto.reversalOfId || null,
        createdBy: dto.createdBy || null,
      }));

      for (const line of dto.lines) {
        await this.ledgerService.addEntry({
          accountId: line.accountId,
          type: line.type,
          amount: line.amount,
          description: line.description,
          category: line.category,
          reference: dto.reference || entryNumber,
          entryDate: entryDate.toISOString(),
          createdBy: dto.createdBy,
          journalEntryId: journalEntry.id,
        }, manager);
      }

      return journalEntry;
    });
  }

  async reverse(journalEntryId: string, narration?: string): Promise<JournalEntry> {
    const original = await this.journalRepo.findOne({ where: { id: journalEntryId } });
    if (!original) throw new NotFoundException('Journal entry not found');

    const originalLines = await this.dataSource.getRepository(LedgerEntry).find({ where: { journalEntryId } });
    if (originalLines.length === 0) throw new NotFoundException('No lines found for journal entry');

    const flipped: JournalLineInput[] = originalLines.map((l) => ({
      accountId: l.accountId,
      type: l.type === LedgerEntryType.DEBIT ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT,
      amount: l.amount,
      description: l.description || undefined,
      category: l.category,
    }));

    return this.post({
      narration: narration || `Reversal of ${original.entryNumber}`,
      sourceType: JournalSourceType.REVERSAL,
      sourceId: original.id,
      reversalOfId: original.id,
      lines: flipped,
    });
  }
}
