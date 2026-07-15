import { apiClient } from '@/lib/axios-client'

export interface CreditNoteLinePayload {
  invoiceItemId: string
  quantity: number
  restoreStock: boolean
}

export interface ReplacementItemPayload {
  itemId: string
  quantity: number
}

export interface CreateCreditNotePayload {
  items: CreditNoteLinePayload[]
  reason?: string
  replacementItems?: ReplacementItemPayload[]
  paymentMethod?: string
}

export interface CreditNoteItem {
  id: string
  invoiceItemId: string
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  taxableValue: number
  gstRate: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
  stockRestored: boolean
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  invoiceId: string
  invoiceNumber: string
  status: 'posted' | 'cancelled'
  reason: string | null
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  taxTotal: number
  grandTotal: number
  replacementInvoiceId: string | null
  items: CreditNoteItem[]
  createdAt: string
}

export interface CreateCreditNoteResponse {
  creditNote: CreditNote
  replacementInvoice: { id: string; invoiceNumber: string } | null
}

export async function createCreditNote(invoiceId: string, payload: CreateCreditNotePayload) {
  const { data } = await apiClient.post<CreateCreditNoteResponse>(`/sales/${invoiceId}/credit-notes`, payload)
  return data
}

export async function getCreditNotes(invoiceId: string) {
  const { data } = await apiClient.get<CreditNote[]>(`/sales/${invoiceId}/credit-notes`)
  return data
}
