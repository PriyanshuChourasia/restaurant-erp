import { apiClient } from '@/lib/axios-client'

export interface PosInvoiceItem {
  itemId: string
  quantity: number
}

export interface CreateInvoiceRequest {
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerGstin?: string
  tableIds?: string[]
  paymentMethod?: string
  discount?: number
  notes?: string
  items: PosInvoiceItem[]
}

export interface CreateKotRequest {
  orderId?: string
  tableIds?: string[]
  station: string
  notes?: string
  items: Array<{ itemId: string; itemName: string; quantity: number; instructions?: string }>
}

export async function createInvoice(payload: CreateInvoiceRequest) {
  const { data } = await apiClient.post('/sales', payload)
  return data
}

export async function createKot(payload: CreateKotRequest) {
  const { data } = await apiClient.post('/kots', payload)
  return data
}

export async function clearInvoiceTables(invoiceId: string) {
  const { data } = await apiClient.post(`/sales/${invoiceId}/clear-tables`)
  return data
}

export async function getInvoice(invoiceId: string) {
  const { data } = await apiClient.get(`/sales/${invoiceId}`)
  return data
}

export async function getDailySales(date?: string) {
  const { data } = await apiClient.get('/sales/daily', { params: date ? { date } : {} })
  return data
}
