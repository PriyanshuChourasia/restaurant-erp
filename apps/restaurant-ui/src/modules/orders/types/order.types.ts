export type OrderType = 'regular' | 'party' | 'scheduled'
export type FulfillmentMethod = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'pending_confirmation' | 'confirmed' | 'billed' | 'cancelled'

export interface OrderItem {
  id: string
  itemId: string
  itemName: string
  hsnCode: string
  quantity: number
  unitPrice: number
  taxableValue: number
  gstRate: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
}

export interface Order {
  id: string
  orderNumber: string
  orderType: OrderType
  fulfillmentMethod: FulfillmentMethod
  status: OrderStatus
  customerName: string | null
  customerPhone: string | null
  customerId: string | null
  tableIds: string[] | null
  reservationId: string | null
  scheduledFor: string | null
  partySize: number | null
  discountPercent: number | null
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  taxTotal: number
  grandTotal: number
  notes: string | null
  invoiceId: string | null
  kotSent: boolean
  items: OrderItem[]
  createdAt: string
  unavailableItems?: { itemName: string; note: string | null }[]
}
