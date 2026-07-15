import { useState } from 'react'
import { Users, Search, Phone, ShoppingCart, TrendingUp, Calendar, Filter } from 'lucide-react'
import { useCustomerDirectory } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, StatusBadge, formatCurrency } from '../components/ReportComponents'

export function CustomerDirectoryPage() {
  const { data, isLoading } = useCustomerDirectory()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const customers = data?.items || []
  const types = [...new Set(customers.map((c) => c.customerType).filter(Boolean))]

  const filtered = customers.filter((c) => {
    const matchesSearch = search === '' ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    const matchesType = typeFilter === 'all' || c.customerType === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Customer Directory"
        description="Complete customer database with spend and activity"
        icon={Users}
        iconColor="bg-blue-600"
        badge={data ? { label: `${data.totalCustomers} customers`, color: 'bg-blue-100 text-blue-700' } : undefined}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Total Customers</span>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{data?.totalCustomers ?? 0}</p>
          <p className="text-xs text-blue-600 mt-1">Registered in system</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Active Customers</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{data?.activeCustomers ?? 0}</p>
          <p className="text-xs text-emerald-600 mt-1">Have visited before</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Avg Spend</span>
            <ShoppingCart size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(data?.avgSpend ?? 0)}</p>
          <p className="text-xs text-purple-600 mt-1">Per customer lifetime</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        </div>
        {types.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400" />
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                typeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Types
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Table */}
      <ReportCard
        title="Customers"
        subtitle={`${filtered.length} customers${search || typeFilter !== 'all' ? ' (filtered)' : ''}`}
      >
        {isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Visits</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Spend</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{c.customerName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-gray-600 text-xs">
                        <Phone size={12} className="text-gray-400" />
                        {c.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={c.customerType || 'Walk-in'}
                        variant={c.customerType === 'registered' ? 'info' : 'neutral'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{c.totalVisits}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(c.totalSpend)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(c.avgOrderValue)}</td>
                    <td className="py-3 px-4 text-center">
                      {c.lastVisit ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Calendar size={11} className="text-gray-400" />
                          {new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={search || typeFilter !== 'all' ? 'No matching customers' : 'No customers yet'}
            description={search || typeFilter !== 'all' ? 'Try adjusting your search or filter' : 'Customers will appear once orders are placed.'}
          />
        )}
      </ReportCard>
    </div>
  )
}
