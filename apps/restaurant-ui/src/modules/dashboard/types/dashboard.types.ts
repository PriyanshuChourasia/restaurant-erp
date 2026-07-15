export interface DashboardSummary {
  todayRevenue: number
  todaySubtotal: number
  todayTax: number
  todayOrders: number
  avgOrderValue: number
  totalTables: number
  activeTables: number
  recentOrders: RecentOrder[]
  popularItems: PopularItem[]
  revenueTrend: RevenueTrendDay[]
}

export interface RecentOrder {
  id: string
  invoiceId: string
  customerName: string | null
  tableIds: string[] | null
  items: number
  total: number
  status: string
  time: string
}

export interface PopularItem {
  name: string
  orders: number
  timesOrdered: number
  revenue: number
  trend: string
}

export interface RevenueTrendDay {
  date: string
  day: string
  sales: number
  orders: number
}
