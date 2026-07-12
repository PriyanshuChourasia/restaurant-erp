export interface DailySalesSummary {
  date: string
  orderCount: number
  totalSales: number
  totalTax: number
  totalDiscount: number
  totalSubtotal: number
  averageOrderValue: number
  paymentBreakdown: Array<{ method: string; count: number; total: number }>
}

export interface DailyTrendEntry {
  date: string
  orderCount: number
  totalSales: number
  totalTax: number
}

export interface SalesReport {
  fromDate: string
  toDate: string
  invoiceCount: number
  totalSales: number
  totalTax: number
  totalDiscount: number
  totalSubtotal: number
  averageOrderValue: number
  minOrder: number
  maxOrder: number
  dailyTrend: DailyTrendEntry[]
}

export interface PaymentMethodEntry {
  method: string
  count: number
  total: number
  average: number
  percentage: number
}

export interface SalesByPaymentMethod {
  fromDate: string
  toDate: string
  grandTotal: number
  methods: PaymentMethodEntry[]
}

export interface CategorySalesEntry {
  categoryId: string | null
  categoryName: string
  categoryLevel: number
  quantitySold: number
  revenue: number
  percentage: number
}

export interface SalesByCategory {
  fromDate: string
  toDate: string
  grandTotal: number
  categories: CategorySalesEntry[]
}

export interface PopularItemEntry {
  rank: number
  itemId: string
  itemName: string
  categoryName: string
  isVeg: boolean
  quantitySold: number
  revenue: number
  timesOrdered: number
  avgQuantityPerOrder: number
}

export interface PopularItemsReport {
  fromDate: string
  toDate: string
  items: PopularItemEntry[]
}

export interface GstRateEntry {
  rate: string
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  itemCount: number
  invoiceCount: number
}

export interface GstReport {
  fromDate: string
  toDate: string
  invoiceCount: number
  itemCount: number
  totalTaxable: number
  totalCgst: number
  totalSgst: number
  totalTax: number
  gstRateSummary: GstRateEntry[]
}

export interface StockStatusItem {
  itemId: string
  itemName: string
  sku: string
  unit: string
  categoryName: string
  productType: string
  openingBalance: number
  currentStock: number
  minStockLevel: number
  unitCost: number
  stockValue: number
  status: 'ok' | 'low' | 'out_of_stock'
}

export interface StockStatusSummary {
  totalItems: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  okCount: number
}

export interface StockStatusReport {
  summary: StockStatusSummary
  items: StockStatusItem[]
}

export interface LowStockItem {
  itemId: string
  itemName: string
  sku: string
  unit: string
  categoryName: string
  currentStock: number
  minStockLevel: number
  deficit: number
  isOut: boolean
}

export interface LowStockReport {
  totalAlerts: number
  outOfStock: number
  lowStock: number
  items: LowStockItem[]
}

export interface BalanceSheetAccount {
  id: string
  name: string
  description: string | null
  openingBalance: number
  totalCredits: number
  totalDebits: number
  currentBalance: number
}

export interface BalanceSheetReport {
  accounts: BalanceSheetAccount[]
  totalCredits: number
  totalDebits: number
  netBalance: number
}

export interface ProfitLossReport {
  fromDate: string
  toDate: string
  revenue: {
    grossSales: number
    discounts: number
    cancelledAmount: number
    netRevenue: number
  }
  costOfGoodsSold: {
    purchases: number
    closingInventory: number
    cogs: number
  }
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  expensesByCategory: Array<{ category: string; amount: number }>
  netProfit: number
  netMargin: number
}

export interface HourlyDistributionEntry {
  hour: number
  label: string
  orderCount: number
  totalSales: number
  avgOrderValue: number
}

export interface HourlyDistributionReport {
  fromDate: string
  toDate: string
  hours: HourlyDistributionEntry[]
}

export interface VegNonVegReport {
  fromDate: string
  toDate: string
  grandTotal: number
  veg: { quantitySold: number; revenue: number; percentage: number }
  nonVeg: { quantitySold: number; revenue: number; percentage: number }
}
