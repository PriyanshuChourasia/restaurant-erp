import { apiClient } from '@/lib/axios-client'

export interface PosInvoiceItem {
  itemId: string
  itemName: string
  hsnCode: string
  quantity: number
  unitPrice: number
  gstRate: number
}

export interface CreateInvoiceRequest {
  customerName?: string
  customerPhone?: string
  customerGstin?: string
  tableNumber?: string
  paymentMethod?: string
  discount?: number
  notes?: string
  items: PosInvoiceItem[]
}

export async function createInvoice(payload: CreateInvoiceRequest) {
  const { data } = await apiClient.post('/sales', payload)
  return data
}

export async function createKot(payload: {
  orderId?: string
  tableNumber?: string
  station: string
  notes?: string
  items: Array<{ itemId: string; itemName: string; quantity: number; instructions?: string }>
}) {
  const { data } = await apiClient.post('/kots', payload)
  return data
}

export async function getDailySales(date?: string) {
  const { data } = await apiClient.get('/sales/daily', { params: date ? { date } : {} })
  return data
}
