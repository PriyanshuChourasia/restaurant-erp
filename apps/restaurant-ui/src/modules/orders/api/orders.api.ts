import { apiClient } from '@/lib/axios-client'
import type { Order, OrderType, OrderStatus } from '../types/order.types'

export interface OrdersResponse {
  data: Order[]
  total: number
  page: number
  limit: number
}

export interface CreateOrderPayload {
  orderType: OrderType
  fulfillmentMethod?: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  tableIds?: string[]
  scheduledFor?: string
  partySize?: number
  discountPercent?: number
  notes?: string
  items: Array<{ itemId: string; quantity: number }>
}

export async function getOrders(params?: { page?: number; limit?: number; status?: OrderStatus; orderType?: OrderType }) {
  const { data } = await apiClient.get<OrdersResponse>('/orders', { params })
  return data
}

export async function getOrder(id: string) {
  const { data } = await apiClient.get<Order>(`/orders/${id}`)
  return data
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await apiClient.post<Order>('/orders', payload)
  return data
}

export async function confirmOrder(id: string) {
  const { data } = await apiClient.post<Order>(`/orders/${id}/confirm`)
  return data
}

export async function sendOrderToKitchen(id: string) {
  const { data } = await apiClient.post<Order>(`/orders/${id}/send-to-kitchen`)
  return data
}

export async function chargeOrder(id: string, paymentMethod: string) {
  const { data } = await apiClient.post<{ order: Order; invoice: { id: string; invoiceNumber: string } }>(
    `/orders/${id}/charge`,
    { paymentMethod },
  )
  return data
}

export async function cancelOrder(id: string) {
  const { data } = await apiClient.post<Order>(`/orders/${id}/cancel`)
  return data
}

export async function updateOrderItems(id: string, items: Array<{ itemId: string; quantity: number }>) {
  const { data } = await apiClient.patch<Order>(`/orders/${id}/items`, { items })
  return data
}
