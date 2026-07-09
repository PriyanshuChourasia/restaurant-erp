import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, DollarSign, Users, UtensilsCrossed, Download, IndianRupee } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

export function ReportsPage() {
  const [period, setPeriod] = useState('week')

  const today = new Date()
  const fromDate = period === 'week'
    ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : period === 'month'
      ? new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      : new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  const toDate = today.toISOString().split('T')[0]

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', fromDate, toDate],
    queryFn: () => apiClient.get('/sales/reports/sales', { params: { fromDate, toDate } }).then(r => r.data),
    enabled: !!fromDate && !!toDate,
  })

  const { data: gstReport, isLoading: gstLoading } = useQuery({
    queryKey: ['gst-report', fromDate, toDate],
    queryFn: () => apiClient.get('/sales/reports/gst', { params: { fromDate, toDate } }).then(r => r.data),
    enabled: !!fromDate && !!toDate,
  })

  const reports = [
    {
      name: 'Daily Sales Report',
      desc: 'Complete daily revenue, orders, and averages breakdown.',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600' as const,
      date: 'Today',
      data: salesReport,
      loading: salesLoading,
    },
    {
      name: 'Popular Items',
      desc: 'Most ordered menu items, revenue contribution, and trends.',
      icon: UtensilsCrossed,
      color: 'from-blue-500 to-blue-600' as const,
      date: period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year',
      data: salesReport,
      loading: salesLoading,
    },
    {
      name: 'GST Report',
      desc: 'GST collected, input tax credit, and liability summary.',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600' as const,
      date: period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year',
      data: gstReport,
      loading: gstLoading,
    },
    {
      name: 'Customer Analysis',
      desc: 'Customer visits, average spend, and loyalty metrics.',
      icon: Users,
      color: 'from-amber-500 to-amber-600' as const,
      date: period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year',
      data: null,
      loading: false,
    },
  ]

  const totalRevenue = salesReport?.totalRevenue || salesReport?.totalSales || 0
  const totalOrders = salesReport?.orderCount || salesReport?.totalOrders || 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">View insights, trends, and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 outline-none bg-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, change: 'vs selected period', color: 'emerald', icon: DollarSign },
          { label: 'Total Orders', value: String(totalOrders), change: 'orders processed', color: 'blue', icon: BarChart3 },
          { label: 'Avg Order Value', value: `₹${avgOrderValue.toFixed(2)}`, change: 'per order', color: 'indigo', icon: TrendingUp },
          { label: 'Period', value: `${fromDate} to ${toDate}`, change: `${period === 'week' ? '7 days' : period === 'month' ? 'Monthly' : 'Yearly'}`, color: 'amber', icon: IndianRupee },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${stat.color}-500 text-white`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div key={report.name} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm hover:border-gray-300">
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${report.color} text-white`}>
                <report.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-xs text-gray-400">{report.desc}</p>
              </div>
            </div>

            {report.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            ) : report.name === 'Daily Sales Report' && report.data ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Revenue</span>
                  <span className="font-semibold text-gray-900">₹{Number(report.data.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">{report.data.orderCount || 0}</span>
                </div>
                {report.data.totalTax && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tax (GST)</span>
                    <span className="font-semibold text-gray-900">₹{Number(report.data.totalTax).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : report.name === 'GST Report' && report.data ? (
              <div className="space-y-2 text-sm">
                {report.data.totalGst && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total GST</span>
                    <span className="font-semibold text-gray-900">₹{Number(report.data.totalGst).toFixed(2)}</span>
                  </div>
                )}
                {report.data.cgst && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">CGST</span>
                    <span className="font-semibold text-gray-900">₹{Number(report.data.cgst).toFixed(2)}</span>
                  </div>
                )}
                {report.data.sgst && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SGST</span>
                    <span className="font-semibold text-gray-900">₹{Number(report.data.sgst).toFixed(2)}</span>
                  </div>
                )}
                {!report.data.totalGst && !report.data.cgst && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tax</span>
                    <span className="font-semibold text-gray-900">₹{Number(report.data.totalTax || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {report.name === 'Customer Analysis' ? 'Coming soon' : 'No data available for selected period'}
              </p>
            )}

            <button className="mt-3 w-full h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
              View Full Report
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
