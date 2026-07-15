import { apiClient } from '@/lib/axios-client'
import type {
  Voucher, VoucherLineInput, JournalVoucherLineInput, LedgerAccountOption, VoucherType, VoucherStatus,
} from '../types/voucher.types'

export interface VouchersResponse {
  data: Voucher[]
  total: number
  page: number
  limit: number
}

export async function getVouchers(params?: { page?: number; limit?: number; voucherType?: VoucherType; status?: VoucherStatus }) {
  const { data } = await apiClient.get<VouchersResponse>('/vouchers', { params })
  return data
}

export async function getVoucher(id: string) {
  const { data } = await apiClient.get<Voucher>(`/vouchers/${id}`)
  return data
}

export interface CreatePaymentVoucherPayload {
  paymentMode: string
  amount: number
  debitLines: VoucherLineInput[]
  narration?: string
  voucherDate?: string
  partyType?: string
  partyId?: string
}

export async function createPaymentVoucher(payload: CreatePaymentVoucherPayload) {
  const { data } = await apiClient.post<Voucher>('/vouchers/payment', payload)
  return data
}

export interface CreateReceiptVoucherPayload {
  paymentMode: string
  amount: number
  creditLines: VoucherLineInput[]
  narration?: string
  voucherDate?: string
  partyType?: string
  partyId?: string
  referenceInvoiceId?: string
}

export async function createReceiptVoucher(payload: CreateReceiptVoucherPayload) {
  const { data } = await apiClient.post<Voucher>('/vouchers/receipt', payload)
  return data
}

export interface CreateJournalVoucherPayload {
  lines: JournalVoucherLineInput[]
  narration?: string
  voucherDate?: string
}

export async function createJournalVoucher(payload: CreateJournalVoucherPayload) {
  const { data } = await apiClient.post<Voucher>('/vouchers/journal', payload)
  return data
}

export async function cancelVoucher(id: string) {
  const { data } = await apiClient.post<Voucher>(`/vouchers/${id}/cancel`)
  return data
}

export async function getLedgerAccountOptions() {
  const { data } = await apiClient.get<LedgerAccountOption[]>('/ledger/accounts')
  return data
}
