import { Link } from '@tanstack/react-router'
import {
  DollarSign, FileText, Package, AlertTriangle, TrendingUp, Clock, IndianRupee,
  BarChart3, ArrowRight, Calendar, ShoppingCart,
} from 'lucide-react'
import { useDailySalesSummary, useLowStockAlerts, useStockStatus } from '../hooks/useReportQueries'
import { REPORT_CATEGORIES } from '../configs'
import type { ReportConfig } from '../types/report-config.types'

const CATEGORY_COLORS: Record<string, { gradient: string; bg: string; text: string }> = {
  inventory: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  financial: { gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  kitchen: { gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700' },
  customer: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  reservation: { gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  procurement: { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' },
  operations: { gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  executive: { gradient: 'from-gray-600 to-gray-800', bg: 'bg-gray-50', text: 'text-gray-700' },
}

const EXISTING_ROUTES: Record<string, string> = {
  'inventory-stock-status': '/reports/stock',
  'inventory-low-stock': '/reports/low-stock',
  'inventory-movements': '/reports/inventory-movements',
  'finance-balance-sheet': '/reports/balance-sheet',
  'finance-profit-loss': '/reports/profit-loss',
  'finance-revenue-vs-expense': '/reports/finance-revenue-vs-expense',
  'operations-hourly': '/reports/hourly',
  'kitchen-queue-status': '/reports/kitchen-queue-status',
  'customer-directory': '/reports/customer-directory',
  'procurement-supplier-performance': '/reports/procurement-supplier-performance',
  'executive-kpi-dashboard': '/reports/executive-kpi-dashboard',
  'executive-health-scorecard': '/reports/executive-health-scorecard',
}

export function ReportsPage() {
  const { data: daily, isLoading: dailyLoading } = useDailySalesSummary()
  const { data: lowStock } = useLowStockAlerts()
  const { data: stock } = useStockStatus()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Business intelligence across all operations</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-700">Today's Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <IndianRupee size={18} />
            </div>
          </div>
          {dailyLoading ? (
            <div className="h-8 bg-emerald-100 rounded animate-pulse w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-900">
                ₹{Number(daily?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-emerald-600">{daily?.orderCount || 0} orders</span>
                <span className="text-emerald-300">·</span>
                <span className="text-xs text-emerald-600">₹{Number(daily?.averageOrderValue || 0).toFixed(0)} avg</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-700">Avg Order Value</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
              <ShoppingCart size={18} />
            </div>
          </div>
          {dailyLoading ? (
            <div className="h-8 bg-blue-100 rounded animate-pulse w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-blue-900">
                ₹{Number(daily?.averageOrderValue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1.5">per order today</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-700">Inventory Alerts</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900">{lowStock?.totalAlerts || 0}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-red-600 font-medium">{lowStock?.outOfStock || 0} out of stock</span>
            <span className="text-amber-300">·</span>
            <span className="text-xs text-amber-600">{lowStock?.lowStock || 0} low</span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-700">Tax Collected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white">
              <FileText size={18} />
            </div>
          </div>
          {dailyLoading ? (
            <div className="h-8 bg-purple-100 rounded animate-pulse w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-purple-900">
                ₹{Number(daily?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-purple-600 mt-1.5">GST today</p>
            </>
          )}
        </div>
      </div>

      {/* Inventory Overview Bar */}
      {stock?.summary && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Inventory Overview</h3>
            </div>
            <Link to="/reports/stock" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Items</p>
              <p className="text-lg font-bold text-gray-900">{stock.summary.totalItems}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-lg font-bold text-gray-900">₹{stock.summary.totalValue.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">In Stock</p>
              <p className="text-lg font-bold text-emerald-700">{stock.summary.okCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Needs Attention</p>
              <p className="text-lg font-bold text-red-700">{stock.summary.lowStockCount + stock.summary.outOfStockCount}</p>
            </div>
          </div>
          {stock.summary.totalItems > 0 && (
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${(stock.summary.okCount / stock.summary.totalItems) * 100}%` }} />
              <div className="bg-amber-500 h-full" style={{ width: `${(stock.summary.lowStockCount / stock.summary.totalItems) * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${(stock.summary.outOfStockCount / stock.summary.totalItems) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Sales Reports (existing dedicated pages) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sales & Revenue</h2>
          </div>
          <span className="text-xs text-gray-400">12 reports</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SALES_REPORT_LINKS.map((r) => (
            <ReportCardLink key={r.to} {...r} />
          ))}
        </div>
      </section>

      {/* Category-based report sections */}
      {REPORT_CATEGORIES.map((cat) => {
        const colors = CATEGORY_COLORS[cat.key] || CATEGORY_COLORS.inventory
        return (
          <section key={cat.key}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors.bg} border`} />
                <h2 className="text-lg font-semibold text-gray-900">{cat.label}</h2>
              </div>
              <span className="text-xs text-gray-400">{cat.reports.length} reports</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.reports.map((r) => (
                <ConfigReportCard key={r.id} config={r} categoryColors={colors} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

const SALES_REPORT_LINKS = [
  { to: '/reports/sales', name: 'Sales Summary', desc: 'Revenue, orders, and performance overview', icon: DollarSign },
  { to: '/reports/payment-methods', name: 'Payment Methods', desc: 'Revenue breakdown by payment channel', icon: DollarSign },
  { to: '/reports/categories', name: 'Sales by Category', desc: 'Revenue by menu category', icon: BarChart3 },
  { to: '/reports/popular-items', name: 'Popular Items', desc: 'Most ordered items', icon: TrendingUp },
  { to: '/reports/gst', name: 'GST Report', desc: 'Tax collected by GST rate', icon: FileText },
  { to: '/reports/hourly', name: 'Hourly Distribution', desc: 'Order patterns by time of day', icon: Clock },
  { to: '/reports/trends', name: 'Trend Analysis', desc: 'Weekly/monthly trends', icon: TrendingUp },
  { to: '/reports/discount-analysis', name: 'Discount Analysis', desc: 'Discount patterns', icon: DollarSign },
  { to: '/reports/invoice-drilldown', name: 'Invoice Drill-Down', desc: 'Line-item tax breakdown', icon: FileText },
  { to: '/reports/cancelled', name: 'Cancelled Transactions', desc: 'Lost revenue tracking', icon: AlertTriangle },
]

function ReportCardLink({ to, name, desc, icon: Icon }: { to: string; name: string; desc: string; icon: any }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
          <Icon size={18} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </Link>
  )
}

function ConfigReportCard({ config, categoryColors }: { config: ReportConfig; categoryColors: { gradient: string; bg: string; text: string } }) {
  const Icon = config.icon
  const existingRoute = EXISTING_ROUTES[config.id]
  const to = existingRoute || `/reports/${config.id}`

  return (
    <Link
      to={to}
      className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${categoryColors.bg} ${categoryColors.text} group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{config.title}</h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{config.description}</p>
      <span className={`text-xs font-medium mt-2 ${categoryColors.text}`}>
        View report <ArrowRight size={10} className="inline group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  )
}
