import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherType, VoucherStatus } from '../entities/voucher.entity';
import { CreatePaymentVoucherDto } from '../dto/create-payment-voucher.dto';
import { CreateReceiptVoucherDto } from '../dto/create-receipt-voucher.dto';
import { CreateJournalVoucherDto } from '../dto/create-journal-voucher.dto';
import { JournalService, JournalLineInput } from '../../ledger/services/journal.service';
import { JournalSourceType } from '../../ledger/entities/journal-entry.entity';
import { LedgerService } from '../../ledger/services/ledger.service';
import { LedgerEntryType, LedgerCategory } from '../../ledger/entities/ledger.entity';

const VOUCHER_PREFIX: Record<VoucherType, string> = {
  [VoucherType.PAYMENT]: 'PAY',
  [VoucherType.RECEIPT]: 'RCT',
  [VoucherType.JOURNAL]: 'JNL',
};

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly repo: Repository<Voucher>,
    private readonly journalService: JournalService,
    private readonly ledgerService: LedgerService,
  ) {}

  private async nextVoucherNumber(type: VoucherType): Promise<string> {
    const count = await this.repo.count({ where: { voucherType: type } });
    return `${VOUCHER_PREFIX[type]}-${String(count + 1).padStart(6, '0')}`;
  }

  /** Cash/UPI/card/online payments settle through "Cash Account" or "Bank Account". */
  private async resolveCashBankAccountId(paymentMode: string): Promise<string> {
    const name = paymentMode === 'cash' ? 'Cash Account' : 'Bank Account';
    const account = await this.ledgerService.getAccountByName(name);
    return account.id;
  }

  private assertLinesSumTo(lines: { amount: number }[], amount: number, label: string) {
    const sum = lines.reduce((s, l) => s + l.amount, 0);
    if (Math.round(sum * 100) !== Math.round(amount * 100)) {
      throw new BadRequestException(`${label} amounts (${sum.toFixed(2)}) must sum to the voucher amount (${amount.toFixed(2)})`);
    }
  }

  private async saveVoucher(
    voucherType: VoucherType,
    journalEntryId: string,
    fields: {
      voucherDate: Date;
      partyType?: string | null;
      partyId?: string | null;
      paymentMode?: string | null;
      amount: number;
      narration?: string | null;
      referenceInvoiceId?: string | null;
      createdBy?: string | null;
    },
  ): Promise<Voucher> {
    const voucherNumber = await this.nextVoucherNumber(voucherType);
    const voucher = this.repo.create({
      voucherNumber,
      voucherType,
      status: VoucherStatus.POSTED,
      voucherDate: fields.voucherDate,
      partyType: fields.partyType || null,
      partyId: fields.partyId || null,
      paymentMode: fields.paymentMode || null,
      amount: fields.amount,
      narration: fields.narration || null,
      journalEntryId,
      referenceInvoiceId: fields.referenceInvoiceId || null,
      createdBy: fields.createdBy || null,
    });
    return this.repo.save(voucher);
  }

  async createPaymentVoucher(dto: CreatePaymentVoucherDto, createdBy?: string): Promise<Voucher> {
    this.assertLinesSumTo(dto.debitLines, dto.amount, 'Debit line');
    const cashBankAccountId = await this.resolveCashBankAccountId(dto.paymentMode);
    const voucherDate = dto.voucherDate ? new Date(dto.voucherDate) : new Date();

    const lines: JournalLineInput[] = [
      ...dto.debitLines.map((l) => ({
        accountId: l.accountId,
        type: LedgerEntryType.DEBIT,
        amount: l.amount,
        description: l.description || dto.narration,
        category: LedgerCategory.EXPENSE,
      })),
      { accountId: cashBankAccountId, type: LedgerEntryType.CREDIT, amount: dto.amount, description: dto.narration },
    ];

    const journalEntry = await this.journalService.post({
      date: voucherDate.toISOString(),
      narration: dto.narration || 'Payment voucher',
      sourceType: JournalSourceType.VOUCHER,
      lines,
      createdBy,
    });

    return this.saveVoucher(VoucherType.PAYMENT, journalEntry.id, {
      voucherDate, partyType: dto.partyType, partyId: dto.partyId,
      paymentMode: dto.paymentMode, amount: dto.amount, narration: dto.narration, createdBy,
    });
  }

  async createReceiptVoucher(dto: CreateReceiptVoucherDto, createdBy?: string): Promise<Voucher> {
    this.assertLinesSumTo(dto.creditLines, dto.amount, 'Credit line');
    const cashBankAccountId = await this.resolveCashBankAccountId(dto.paymentMode);
    const voucherDate = dto.voucherDate ? new Date(dto.voucherDate) : new Date();

    const lines: JournalLineInput[] = [
      { accountId: cashBankAccountId, type: LedgerEntryType.DEBIT, amount: dto.amount, description: dto.narration },
      ...dto.creditLines.map((l) => ({
        accountId: l.accountId,
        type: LedgerEntryType.CREDIT,
        amount: l.amount,
        description: l.description || dto.narration,
        category: LedgerCategory.SALES,
      })),
    ];

    const journalEntry = await this.journalService.post({
      date: voucherDate.toISOString(),
      narration: dto.narration || 'Receipt voucher',
      sourceType: JournalSourceType.VOUCHER,
      lines,
      createdBy,
    });

    return this.saveVoucher(VoucherType.RECEIPT, journalEntry.id, {
      voucherDate, partyType: dto.partyType, partyId: dto.partyId,
      paymentMode: dto.paymentMode, amount: dto.amount, narration: dto.narration,
      referenceInvoiceId: dto.referenceInvoiceId, createdBy,
    });
  }

  async createJournalVoucher(dto: CreateJournalVoucherDto, createdBy?: string): Promise<Voucher> {
    const voucherDate = dto.voucherDate ? new Date(dto.voucherDate) : new Date();
    const amount = dto.lines
      .filter((l) => l.type === LedgerEntryType.DEBIT)
      .reduce((s, l) => s + l.amount, 0);

    const journalEntry = await this.journalService.post({
      date: voucherDate.toISOString(),
      narration: dto.narration || 'Journal voucher',
      sourceType: JournalSourceType.VOUCHER,
      lines: dto.lines,
      createdBy,
    });

    return this.saveVoucher(VoucherType.JOURNAL, journalEntry.id, {
      voucherDate, amount, narration: dto.narration, createdBy,
    });
  }

  async findAll(page = 1, limit = 20, voucherType?: VoucherType, status?: VoucherStatus) {
    const query = this.repo.createQueryBuilder('v').orderBy('v.createdAt', 'DESC');
    if (voucherType) query.andWhere('v.voucherType = :voucherType', { voucherType });
    if (status) query.andWhere('v.status = :status', { status });
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Voucher> {
    const voucher = await this.repo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async cancelVoucher(id: string): Promise<Voucher> {
    const voucher = await this.findById(id);
    if (voucher.status === VoucherStatus.CANCELLED) {
      throw new BadRequestException('Voucher is already cancelled');
    }
    await this.journalService.reverse(voucher.journalEntryId, `Cancellation of voucher ${voucher.voucherNumber}`);
    voucher.status = VoucherStatus.CANCELLED;
    return this.repo.save(voucher);
  }
}
