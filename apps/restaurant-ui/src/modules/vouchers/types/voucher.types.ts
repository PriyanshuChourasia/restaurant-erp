export type VoucherType = 'payment' | 'receipt' | 'journal'
export type VoucherStatus = 'posted' | 'cancelled'
export type LedgerEntryDirection = 'debit' | 'credit'

export interface Voucher {
  id: string
  voucherNumber: string
  voucherType: VoucherType
  status: VoucherStatus
  voucherDate: string
  partyType: string | null
  partyId: string | null
  paymentMode: string | null
  amount: number
  narration: string | null
  journalEntryId: string
  referenceInvoiceId: string | null
  createdAt: string
}

export interface VoucherLineInput {
  accountId: string
  amount: number
  description?: string
}

export interface JournalVoucherLineInput {
  accountId: string
  type: LedgerEntryDirection
  amount: number
  description?: string
}

export interface LedgerAccountOption {
  id: string
  name: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  currentBalance: number
}
