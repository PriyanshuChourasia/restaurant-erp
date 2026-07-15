import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AccountType, LedgerAccount, LedgerEntry, LedgerEntryType, LedgerCategory } from '../entities/ledger.entity';

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

  async getAccount(id: string, manager?: EntityManager) {
    const accountRepo = manager ? manager.getRepository(LedgerAccount) : this.accountRepo;
    const account = await accountRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async getAccountByName(name: string): Promise<LedgerAccount> {
    const account = await this.accountRepo.findOne({ where: { name } });
    if (!account) throw new NotFoundException(`Ledger account "${name}" not found`);
    return account;
  }

  async createAccount(dto: { name: string; accountType: AccountType; code?: string; description?: string; openingBalance?: number; financialYear?: string }) {
    const account = this.accountRepo.create({
      name: dto.name,
      accountType: dto.accountType,
      code: dto.code || null,
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
    journalEntryId?: string;
  }, manager?: EntityManager) {
    const accountRepo = manager ? manager.getRepository(LedgerAccount) : this.accountRepo;
    const entryRepo = manager ? manager.getRepository(LedgerEntry) : this.entryRepo;

    const account = await this.getAccount(dto.accountId, manager);

    // Debit-normal accounts (asset/expense) increase on DEBIT and decrease on CREDIT.
    // Credit-normal accounts (liability/equity/revenue) do the opposite.
    const isDebitNormal = account.accountType === AccountType.ASSET || account.accountType === AccountType.EXPENSE;
    const isDebit = dto.type === LedgerEntryType.DEBIT;
    const increases = isDebitNormal ? isDebit : !isDebit;
    const balanceAfter = increases
      ? account.currentBalance + dto.amount
      : account.currentBalance - dto.amount;

    const entry = entryRepo.create({
      accountId: dto.accountId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description || null,
      category: dto.category || LedgerCategory.MISCELLANEOUS,
      reference: dto.reference || null,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
      balanceAfter,
      journalEntryId: dto.journalEntryId || null,
      createdBy: dto.createdBy || null,
    });
    await entryRepo.save(entry);

    account.currentBalance = balanceAfter;
    await accountRepo.save(account);
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
