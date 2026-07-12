import { Link } from '@tanstack/react-router'
import {
  DollarSign, CreditCard, Layers, UtensilsCrossed, FileText,
  Package, AlertTriangle, TrendingUp, Clock, IndianRupee,
} from 'lucide-react'
import { useDailySalesSummary, useLowStockAlerts } from '../hooks/useReportQueries'

const reportCards = [
  {
    to: '/reports/sales',
    name: 'Sales Summary',
    desc: 'Revenue, orders, and performance overview',
    icon: DollarSign,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    to: '/reports/payment-methods',
    name: 'Payment Methods',
    desc: 'Revenue breakdown by payment channel',
    icon: CreditCard,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    to: '/reports/categories',
    name: 'Sales by Category',
    desc: 'Revenue by menu category',
    icon: Layers,
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
  },
  {
    to: '/reports/popular-items',
    name: 'Popular Items',
    desc: 'Most ordered items and dietary mix',
    icon: UtensilsCrossed,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    to: '/reports/gst',
    name: 'GST Report',
    desc: 'Tax collected by GST rate for filing',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
  },
  {
    to: '/reports/stock',
    name: 'Stock Status',
    desc: 'Current inventory levels across all items',
    icon: Package,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
  },
  {
    to: '/reports/low-stock',
    name: 'Low Stock Alerts',
    desc: 'Items that need restocking',
    icon: AlertTriangle,
    color: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
  },
  {
    to: '/reports/profit-loss',
    name: 'Profit & Loss',
    desc: 'Revenue, costs, and profitability',
    icon: TrendingUp,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
  },
]

export function ReportsPage() {
  const { data: daily } = useDailySalesSummary()
  const { data: lowStock } = useLowStockAlerts()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Business intelligence and performance insights</p>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Today's Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ₹{Number(daily?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">{daily?.orderCount || 0} orders today</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Avg Order</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ₹{Number(daily?.averageOrderValue || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">per order today</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Low Stock Items</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{lowStock?.totalAlerts || 0}</p>
          <p className="text-xs text-gray-400 mt-1">{lowStock?.outOfStock || 0} out of stock</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Tax Collected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ₹{Number(daily?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">GST today</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((report) => {
            const Icon = report.icon
            return (
              <Link
                key={report.to}
                to={report.to}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${report.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">{report.name}</h3>
                    <p className="text-xs text-gray-400">{report.desc}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 group-hover:text-gray-500 transition-colors">
                  Click to view report →
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
