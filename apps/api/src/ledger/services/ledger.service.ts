import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerAccount, LedgerEntry, LedgerEntryType, LedgerCategory } from '../entities/ledger.entity';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerAccount)
    private readonly accountRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly entryRepo: Repository<LedgerEntry>,
  ) {}

  async getAccounts() {
    return this.accountRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async getAccount(id: string) {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async createAccount(dto: { name: string; description?: string; openingBalance?: number; financialYear?: string }) {
    const account = this.accountRepo.create({
      name: dto.name,
      description: dto.description || null,
      openingBalance: dto.openingBalance || 0,
      currentBalance: dto.openingBalance || 0,
      financialYear: dto.financialYear || null,
    });
    return this.accountRepo.save(account);
  }

  async setOpeningBalance(accountId: string, amount: number, financialYear?: string) {
    const account = await this.getAccount(accountId);
    account.openingBalance = amount;
    account.currentBalance = amount;
    if (financialYear) account.financialYear = financialYear;
    return this.accountRepo.save(account);
  }

  async addEntry(dto: {
    accountId: string;
    type: LedgerEntryType;
    amount: number;
    description?: string;
    category?: LedgerCategory;
    reference?: string;
    entryDate?: string;
    createdBy?: string;
  }) {
    const account = await this.getAccount(dto.accountId);
    const balanceAfter = dto.type === LedgerEntryType.CREDIT
      ? account.currentBalance + dto.amount
      : account.currentBalance - dto.amount;

    if (dto.type === LedgerEntryType.DEBIT && balanceAfter < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    const entry = this.entryRepo.create({
      accountId: dto.accountId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description || null,
      category: dto.category || LedgerCategory.MISCELLANEOUS,
      reference: dto.reference || null,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
      balanceAfter,
      createdBy: dto.createdBy || null,
    });
    await this.entryRepo.save(entry);

    account.currentBalance = balanceAfter;
    await this.accountRepo.save(account);
    return entry;
  }

  async getEntries(accountId: string, page = 1, limit = 20) {
    const [data, total] = await this.entryRepo.findAndCount({
      where: { accountId },
      order: { entryDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getBalanceSheet() {
    const accounts = await this.getAccounts();
    const totalCredits = accounts.reduce((s, a) => s + (a.currentBalance > 0 ? a.currentBalance : 0), 0);
    const totalDebits = accounts.reduce((s, a) => s + (a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0), 0);
    return { accounts, totalCredits, totalDebits, balance: totalCredits - totalDebits };
  }
}
