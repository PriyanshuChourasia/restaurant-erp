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

// ── RPT-S07: Weekly/Monthly Trends ───────────────────────────────────────

export interface TrendPeriod {
  periodStart: string
  periodLabel: string
  invoiceCount: number
  subtotal: number
  discounts: number
  tax: number
  revenue: number
  avgOrderValue: number
  change: number | null
}

export interface SalesTrendsReport {
  fromDate: string
  toDate: string
  groupBy: 'week' | 'month'
  totalRevenue: number
  totalInvoices: number
  periods: TrendPeriod[]
}

// ── RPT-S08: Discount Analysis ────────────────────────────────────────────

export interface DiscountByPaymentMethod {
  method: string
  count: number
  totalDiscount: number
  avgDiscount: number
}

export interface HighDiscountInvoice {
  invoiceId: string
  invoiceNumber: string
  date: string
  customerName: string
  subtotal: number
  discount: number
  discountPercent: number
  grandTotal: number
}

export interface DiscountDistribution {
  noDiscount: { count: number; percentage: number }
  upTo5Percent: { count: number; percentage: number }
  upTo10Percent: { count: number; percentage: number }
  above10Percent: { count: number; percentage: number }
}

export interface DiscountAnalysisReport {
  fromDate: string
  toDate: string
  totalInvoices: number
  totalSubtotal: number
  totalDiscount: number
  avgDiscountPerInvoice: number
  discountRate: number
  discountDistribution: DiscountDistribution
  byPaymentMethod: DiscountByPaymentMethod[]
  highDiscountInvoices: HighDiscountInvoice[]
}

// ── RPT-S10: Invoice-Level Drill-Down ─────────────────────────────────────

export interface InvoiceDrillDownItem {
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

export interface TaxRateSummary {
  rate: string
  taxableValue: number
  cgst: number
  sgst: number
}

export interface InvoiceDrillDownReport {
  id: string
  invoiceNumber: string
  invoiceDate: string
  status: string
  customerName: string | null
  customerPhone: string | null
  customerGstin: string | null
  paymentMethod: string
  tableIds: string[] | null
  subtotal: number
  discount: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  taxTotal: number
  roundOff: number
  grandTotal: number
  notes: string | null
  taxRateSummary: TaxRateSummary[]
  items: InvoiceDrillDownItem[]
}

// ── RPT-S11: Cancelled & Voided Transactions ──────────────────────────────

export interface CancelledInvoice {
  invoiceId: string
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  paymentMethod: string
  subtotal: number
  discount: number
  grandTotal: number
  notes: string | null
}

export interface CancelledTransactionsReport {
  fromDate: string
  toDate: string
  cancelledCount: number
  totalInvoices: number
  cancelRate: number
  lostRevenue: number
  avgLostPerInvoice: number
  invoices: CancelledInvoice[]
}

// ── RPT-F04: GST Return ────────────────────────────────────────────────────

export interface GstReturnEntry {
  rate: string
  taxableValue: number
  cgst: number
  sgst: number
  totalTax: number
}

export interface GstReturnReport {
  fromDate: string
  toDate: string
  totalGstCollected: number
  totalItc: number
  netPayable: number
  items: GstReturnEntry[]
}

// ── RPT-F07: Tax Summary ───────────────────────────────────────────────────

export interface TaxSummaryEntry {
  taxType: string
  collected: number
  paid: number
  netLiability: number
}

export interface TaxSummaryReport {
  fromDate: string
  toDate: string
  cgstCollected: number
  sgstCollected: number
  igstCollected: number
  totalTaxCollected: number
  netGstLiability: number
  items: TaxSummaryEntry[]
}

// ── RPT-I03: Stock Movement Ledger ──────────────────────────────────────────

export interface StockMovement {
  date: string
  itemName: string
  movementType: string
  quantity: number
  balanceBefore: number
  balanceAfter: number
  reference: string | null
  notes: string | null
}

export interface StockMovementReport {
  fromDate: string
  toDate: string
  totalMovements: number
  uniqueItems: number
  items: StockMovement[]
}

// ── RPT-I04: Stock Valuation ────────────────────────────────────────────────

export interface StockValuationItem {
  itemName: string
  categoryName: string
  productType: string
  currentStock: number
  unitCost: number
  stockValue: number
}

export interface StockValuationReport {
  totalValue: number
  categoryCount: number
  items: StockValuationItem[]
}

// ── RPT-I05: Wastage Report ─────────────────────────────────────────────────

export interface WastageItem {
  itemName: string
  wastageQuantity: number
  wastageValue: number
  reason: string
}

export interface WastageReport {
  fromDate: string
  toDate: string
  totalWastage: number
  wastageRate: number
  items: WastageItem[]
}

// ── RPT-I06: Consumption Analysis ───────────────────────────────────────────

export interface ConsumptionItem {
  itemName: string
  totalConsumed: number
  avgDaily: number
  daysUntilStockout: string
}

export interface ConsumptionReport {
  fromDate: string
  toDate: string
  totalConsumed: number
  avgDailyConsumption: number
  items: ConsumptionItem[]
}

// ── RPT-I07: Production Report ──────────────────────────────────────────────

export interface ProductionItem {
  date: string
  itemName: string
  batchQuantity: number
  productionCost: number
  createdBy: string
}

export interface ProductionReport {
  fromDate: string
  toDate: string
  totalBatches: number
  totalCost: number
  items: ProductionItem[]
}

// ── RPT-I08: Recipe Cost Analysis ───────────────────────────────────────────

export interface RecipeCostItem {
  itemName: string
  categoryName: string
  totalIngredientCost: number
  costPerUnit: number
  sellingPrice: number
  foodCostPercent: number
  grossMargin: number
}

export interface RecipeCostsReport {
  totalItems: number
  avgFoodCost: number
  items: RecipeCostItem[]
}

// ── RPT-I09: Stock Reconciliation ───────────────────────────────────────────

export interface ReconciliationItem {
  itemName: string
  systemStock: number
  physicalCount: number
  variance: number
  varianceValue: number
}

export interface ReconciliationReport {
  totalItems: number
  itemsWithVariance: number
  items: ReconciliationItem[]
}

// ── RPT-I10: Purchase Timeline ──────────────────────────────────────────────

export interface PurchaseTimelineItem {
  purchaseNumber: string
  orderDate: string
  supplierName: string
  receivedDate: string
  leadTime: number
}

export interface PurchaseTimelineReport {
  fromDate: string
  toDate: string
  totalOrders: number
  avgLeadTime: number
  items: PurchaseTimelineItem[]
}

// ── RPT-F03: Cash Flow ──────────────────────────────────────────────────────

export interface CashFlowItem {
  activity: string
  category: string
  amount: number
}

export interface CashFlowReport {
  fromDate: string
  toDate: string
  operatingCashFlow: number
  netChange: number
  items: CashFlowItem[]
}

// ── RPT-F05: Expense Report ─────────────────────────────────────────────────

export interface ExpenseItem {
  category: string
  description: string
  date: string
  amount: number
  percentage: number
}

export interface ExpenseReport {
  fromDate: string
  toDate: string
  totalExpenses: number
  categoryCount: number
  items: ExpenseItem[]
}

// ── RPT-F06: Revenue vs Expense ─────────────────────────────────────────────

export interface RevenueVsExpenseItem {
  period: string
  revenue: number
  expenses: number
  netIncome: number
}

export interface RevenueVsExpenseReport {
  fromDate: string
  toDate: string
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  items: RevenueVsExpenseItem[]
}

// ── RPT-F08: Ledger Statement ───────────────────────────────────────────────

export interface LedgerEntry {
  date: string
  type: 'credit' | 'debit'
  description: string
  amount: number
  balanceAfter: number
}

export interface LedgerStatementReport {
  fromDate: string
  toDate: string
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
  items: LedgerEntry[]
}

// ── RPT-K01: Kitchen Queue Status ───────────────────────────────────────────

export interface QueueStatusItem {
  kotNumber: string
  station: string
  tables: string
  itemCount: number
  status: string
  elapsedMinutes: number
}

export interface QueueStatusReport {
  pending: number
  preparing: number
  ready: number
  overdue: number
  items: QueueStatusItem[]
}

// ── RPT-K02: Kitchen Performance ────────────────────────────────────────────

export interface KitchenPerformanceItem {
  station: string
  avgPrepTime: number
  avgCookTime: number
  avgTotalTime: number
  orderCount: number
}

export interface KitchenPerformanceReport {
  fromDate: string
  toDate: string
  avgPrepTime: number
  avgCookTime: number
  avgTotalTime: number
  items: KitchenPerformanceItem[]
}

// ── RPT-K03: Station Load ───────────────────────────────────────────────────

export interface StationLoadItem {
  station: string
  orderCount: number
  itemCount: number
  pending: number
  utilization: number
}

export interface StationLoadReport {
  fromDate: string
  toDate: string
  totalOrders: number
  busiestStation: string
  items: StationLoadItem[]
}

// ── RPT-K04: Item Frequency ─────────────────────────────────────────────────

export interface ItemFrequencyItem {
  itemName: string
  timesOrdered: number
  totalQuantity: number
  station: string
}

export interface ItemFrequencyReport {
  fromDate: string
  toDate: string
  uniqueItems: number
  totalOrdered: number
  items: ItemFrequencyItem[]
}

// ── RPT-K05: KOT Cancellation ───────────────────────────────────────────────

export interface KOTCancellationItem {
  station: string
  cancelledCount: number
  cancelRate: number
}

export interface KOTCancellationReport {
  fromDate: string
  toDate: string
  cancelledCount: number
  cancelRate: number
  items: KOTCancellationItem[]
}

// ── RPT-K06: Throughput ─────────────────────────────────────────────────────

export interface ThroughputItem {
  period: string
  ordersCompleted: number
  itemsPrepared: number
  throughputRate: number
}

export interface ThroughputReport {
  fromDate: string
  toDate: string
  peakThroughput: number
  avgThroughput: number
  items: ThroughputItem[]
}

// ── RPT-K07: Dietary Mix ────────────────────────────────────────────────────

export interface DietaryMixItem {
  category: string
  itemCount: number
  percentage: number
}

export interface DietaryMixReport {
  fromDate: string
  toDate: string
  vegPercentage: number
  nonVegPercentage: number
  items: DietaryMixItem[]
}

// ── RPT-C01: Customer Directory ─────────────────────────────────────────────

export interface CustomerDirectoryEntry {
  customerName: string
  phone: string
  customerType: string
  totalVisits: number
  totalSpend: number
  avgOrderValue: number
  lastVisit: string | null
}

export interface CustomerDirectoryReport {
  totalCustomers: number
  activeCustomers: number
  avgSpend: number
  items: CustomerDirectoryEntry[]
}

// ── RPT-C02: Customer Revenue ───────────────────────────────────────────────

export interface CustomerRevenueEntry {
  customerName: string
  totalRevenue: number
  revenueShare: number
  orderCount: number
}

export interface CustomerRevenueReport {
  fromDate: string
  toDate: string
  topCustomerRevenue: number
  top10PercentShare: number
  items: CustomerRevenueEntry[]
}

// ── RPT-C03: Loyalty ────────────────────────────────────────────────────────

export interface LoyaltyEntry {
  customerName: string
  firstVisit: string
  lastVisit: string
  totalVisits: number
  rfmScore: number
}

export interface LoyaltyReport {
  fromDate: string
  toDate: string
  repeatRate: number
  churnRisk: number
  avgTenureDays: number
  items: LoyaltyEntry[]
}

// ── RPT-C04: New vs Returning ───────────────────────────────────────────────

export interface NewVsReturningItem {
  period: string
  newCustomers: number
  returningCustomers: number
  newRevenue: number
  returningRevenue: number
}

export interface NewVsReturningReport {
  fromDate: string
  toDate: string
  newCustomers: number
  returningCustomers: number
  retentionRate: number
  items: NewVsReturningItem[]
}

// ── RPT-C05: Type Analysis ──────────────────────────────────────────────────

export interface TypeAnalysisItem {
  customerType: string
  customerCount: number
  totalRevenue: number
  avgOrderValue: number
}

export interface TypeAnalysisReport {
  fromDate: string
  toDate: string
  segmentCount: number
  avgAov: number
  items: TypeAnalysisItem[]
}

// ── RPT-C06: Lifetime Value ─────────────────────────────────────────────────

export interface LifetimeValueEntry {
  customerName: string
  tenureMonths: number
  totalSpend: number
  monthlyAvg: number
  projectedAnnual: number
}

export interface LifetimeValueReport {
  fromDate: string
  toDate: string
  avgClv: number
  highValueCount: number
  items: LifetimeValueEntry[]
}

// ── RPT-C07: Preferences ────────────────────────────────────────────────────

export interface PreferenceEntry {
  customerName: string
  favoriteItem: string
  preferredCategory: string
  avgItemsPerOrder: number
  preferredTime: string
}

export interface PreferencesReport {
  fromDate: string
  toDate: string
  topItemOrders: number
  avgItemsPerOrder: number
  items: PreferenceEntry[]
}

// ── RPT-C08: Walkin vs Registered ───────────────────────────────────────────

export interface WalkinVsRegisteredEntry {
  segment: string
  invoiceCount: number
  totalRevenue: number
  avgOrderValue: number
}

export interface WalkinVsRegisteredReport {
  fromDate: string
  toDate: string
  walkinRevenue: number
  registeredRevenue: number
  items: WalkinVsRegisteredEntry[]
}

// ── RPT-R01: Reservation Overview ───────────────────────────────────────────

export interface ReservationOverviewEntry {
  id: string
  guestName: string
  scheduledFor: string
  partySize: number
  status: string
  source: string
  tableLabel: string
}

export interface ReservationOverviewReport {
  todayCount: number
  confirmed: number
  seated: number
  cancelled: number
  items: ReservationOverviewEntry[]
}

// ── RPT-R02: Table Utilization ──────────────────────────────────────────────

export interface TableUtilizationEntry {
  tableLabel: string
  zoneName: string
  capacity: number
  utilizationRate: number
  revenue: number
  avgDuration: number
}

export interface TableUtilizationReport {
  fromDate: string
  toDate: string
  avgUtilization: number
  revenuePerSeat: number
  items: TableUtilizationEntry[]
}

// ── RPT-R03: Source Analysis ────────────────────────────────────────────────

export interface ReservationSourceEntry {
  source: string
  count: number
  percentage: number
  avgPartySize: number
  noShowRate: number
}

export interface ReservationSourceReport {
  fromDate: string
  toDate: string
  onlineCount: number
  phoneCount: number
  walkinCount: number
  items: ReservationSourceEntry[]
}

// ── RPT-R04: No-Show ────────────────────────────────────────────────────────

export interface NoShowEntry {
  period: string
  noShows: number
  cancellations: number
  noShowRate: number
  cancelRate: number
}

export interface NoShowReport {
  fromDate: string
  toDate: string
  noShowRate: number
  cancelRate: number
  lostRevenue: number
  items: NoShowEntry[]
}

// ── RPT-R05: Peak Hours ─────────────────────────────────────────────────────

export interface PeakHourEntry {
  hour: string
  dayOfWeek: string
  reservationCount: number
  avgPartySize: number
  demandScore: number
}

export interface PeakHoursReport {
  fromDate: string
  toDate: string
  peakDemand: number
  avgPartySize: number
  items: PeakHourEntry[]
}

// ── RPT-R06: Zone Performance ───────────────────────────────────────────────

export interface ZonePerformanceEntry {
  zoneName: string
  tableCount: number
  totalCapacity: number
  utilizationRate: number
  revenue: number
  revenuePerSeat: number
}

export interface ZonePerformanceReport {
  fromDate: string
  toDate: string
  zoneCount: number
  avgUtilization: number
  items: ZonePerformanceEntry[]
}

// ── RPT-P01: PO Summary ─────────────────────────────────────────────────────

export interface POSummaryEntry {
  purchaseNumber: string
  purchaseDate: string
  supplierName: string
  status: string
  totalAmount: number
}

export interface POSummaryReport {
  fromDate: string
  toDate: string
  totalPos: number
  totalValue: number
  outstanding: number
  items: POSummaryEntry[]
}

// ── RPT-P02: Supplier Performance ───────────────────────────────────────────

export interface SupplierPerformanceEntry {
  supplierName: string
  totalOrders: number
  totalSpend: number
  onTimeDelivery: number
  avgLeadTime: number
}

export interface SupplierPerformanceReport {
  fromDate: string
  toDate: string
  activeSuppliers: number
  totalSpend: number
  onTimeDelivery: number
  items: SupplierPerformanceEntry[]
}

// ── RPT-P03: Purchase by Item ───────────────────────────────────────────────

export interface PurchaseByItemEntry {
  itemName: string
  categoryName: string
  quantityPurchased: number
  totalCost: number
  avgUnitPrice: number
}

export interface PurchaseByItemReport {
  fromDate: string
  toDate: string
  totalItems: number
  totalCost: number
  items: PurchaseByItemEntry[]
}

// ── RPT-P04: Price Comparison ───────────────────────────────────────────────

export interface PriceComparisonEntry {
  itemName: string
  supplierAPrice: number
  supplierBPrice: number
  bestValue: string
  percentDifference: number
}

export interface PriceComparisonReport {
  fromDate: string
  toDate: string
  totalItems: number
  potentialSavings: number
  items: PriceComparisonEntry[]
}

// ── RPT-P05: Purchase-to-Pay ────────────────────────────────────────────────

export interface PurchaseToPayEntry {
  purchaseNumber: string
  supplierName: string
  orderDate: string
  status: string
  receivedDate: string
  daysToReceive: number
}

export interface PurchaseToPayReport {
  fromDate: string
  toDate: string
  avgDaysToReceive: number
  pendingCount: number
  items: PurchaseToPayEntry[]
}

// ── RPT-P06: Reorder ────────────────────────────────────────────────────────

export interface ReorderEntry {
  itemName: string
  currentStock: number
  reorderPoint: number
  daysUntilStockout: string
  suggestedQty: number
  preferredSupplier: string
}

export interface ReorderReport {
  fromDate: string
  toDate: string
  itemsToReorder: number
  urgentItems: number
  items: ReorderEntry[]
}

// ── RPT-P07: Monthly Trend ──────────────────────────────────────────────────

export interface MonthlyTrendEntry {
  month: string
  poCount: number
  totalValue: number
  momChange: number
  topSupplier: string
}

export interface MonthlyTrendReport {
  fromDate: string
  toDate: string
  monthTotal: number
  momChange: number
  items: MonthlyTrendEntry[]
}

// ── RPT-O01: Daily Operations Summary ───────────────────────────────────────

export interface DailyOpsSummaryReport {
  date: string
  todayRevenue: number
  orderCount: number
  tablesOccupied: number
  lowStockItems: number
}

// ── RPT-O02: Staff Activity ─────────────────────────────────────────────────

export interface StaffActivityEntry {
  staffName: string
  role: string
  actionCount: number
  ordersHandled: number
  lastActive: string | null
}

export interface StaffActivityReport {
  fromDate: string
  toDate: string
  activeStaff: number
  totalActions: number
  items: StaffActivityEntry[]
}

// ── RPT-O03: Hourly Operations ──────────────────────────────────────────────

export interface HourlyOpsEntry {
  hour: string
  sales: number
  orders: number
  kots: number
  tablesActive: number
}

export interface HourlyOpsReport {
  fromDate: string
  toDate: string
  peakHourSales: number
  peakHourOrders: number
  items: HourlyOpsEntry[]
}

// ── RPT-O04: Weekly Review ──────────────────────────────────────────────────

export interface WeeklyReviewEntry {
  day: string
  revenue: number
  orders: number
  avgOrderValue: number
  reservations: number
  noShows: number
}

export interface WeeklyReviewReport {
  fromDate: string
  toDate: string
  weeklyRevenue: number
  bestDay: string
  wowChange: number
  items: WeeklyReviewEntry[]
}

// ── RPT-O05: Peak Staffing ──────────────────────────────────────────────────

export interface PeakStaffingEntry {
  hour: string
  revenue: number
  ordersPerHour: number
  staffNeeded: number
  currentStaff: number
  gap: number
}

export interface PeakStaffingReport {
  fromDate: string
  toDate: string
  peakStaffNeeded: number
  staffingGap: number
  items: PeakStaffingEntry[]
}

// ── RPT-O06: Payment Collection ─────────────────────────────────────────────

export interface PaymentCollectionEntry {
  method: string
  invoiceCount: number
  totalCollected: number
  percentage: number
  avgTransaction: number
}

export interface PaymentCollectionReport {
  fromDate: string
  toDate: string
  cashCollected: number
  cardUpiCollected: number
  creditOutstanding: number
  items: PaymentCollectionEntry[]
}

// ── RPT-O07: Cancellation Summary ───────────────────────────────────────────

export interface CancellationSummaryEntry {
  category: string
  totalCreated: number
  cancelled: number
  cancelRate: number
}

export interface CancellationSummaryReport {
  fromDate: string
  toDate: string
  totalCancelled: number
  revenueImpact: number
  cancelRate: number
  items: CancellationSummaryEntry[]
}

// ── RPT-O08: EoD Reconciliation ─────────────────────────────────────────────

export interface EodReconciliationEntry {
  section: string
  metric: string
  value: number
}

export interface EodReconciliationReport {
  fromDate: string
  toDate: string
  totalRevenue: number
  totalInvoices: number
  cancelledInvoices: number
  wastageValue: number
  items: EodReconciliationEntry[]
}

// ── RPT-E01: KPI Dashboard ──────────────────────────────────────────────────

export interface KpiDashboardReport {
  totalRevenue: number
  grossMargin: number
  netProfit: number
  repeatRate: number
  tableTurnover: number
  wastePercent: number
  vsLastPeriod: number
}

// ── RPT-E02: Profitability ──────────────────────────────────────────────────

export interface ProfitabilityEntry {
  dimension: string
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface ProfitabilityReport {
  fromDate: string
  toDate: string
  grossProfit: number
  avgMargin: number
  items: ProfitabilityEntry[]
}

// ── RPT-E03: Health Scorecard ───────────────────────────────────────────────

export interface HealthScorecardEntry {
  category: string
  score: number
  weight: number
  status: string
}

export interface HealthScorecardReport {
  overallScore: number
  financialScore: number
  operationalScore: number
  customerScore: number
  items: HealthScorecardEntry[]
}

// ── RPT-E04: Trend Forecast ─────────────────────────────────────────────────

export interface TrendForecastEntry {
  period: string
  revenue: number
  orders: number
  avgOrderValue: number
  foodCostPercent: number
  type: string
}

export interface TrendForecastReport {
  fromDate: string
  toDate: string
  revenueGrowth: number
  forecastNextMonth: number
  items: TrendForecastEntry[]
}

// ── RPT-E05: Comparative ────────────────────────────────────────────────────

export interface ComparativeEntry {
  dimension: string
  current: number
  previous: number
  change: number
  direction: string
}

export interface ComparativeReport {
  fromDate: string
  toDate: string
  periodRevenue: number
  periodChange: number
  items: ComparativeEntry[]
}
