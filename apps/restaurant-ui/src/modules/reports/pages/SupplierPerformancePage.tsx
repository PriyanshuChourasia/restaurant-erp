import { Star, ShoppingCart, Truck, TrendingUp, Clock } from 'lucide-react'
import { useSupplierPerformance } from '../hooks/useReportQueries'
import { ReportPageHeader, LoadingSkeleton, EmptyState, formatCurrency } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

function ratingColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 75) return 'text-amber-600'
  return 'text-red-600'
}

function ratingBg(pct: number): string {
  if (pct >= 90) return 'bg-emerald-50 border-emerald-200'
  if (pct >= 75) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function stars(count: number): string {
  if (count >= 90) return '★★★★★'
  if (count >= 75) return '★★★★'
  if (count >= 60) return '★★★'
  if (count >= 40) return '★★'
  return '★'
}

export function SupplierPerformancePage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data, isLoading } = useSupplierPerformance(fromDate, toDate)

  const suppliers = data?.items || []

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Supplier Performance"
        description="Supplier reliability, lead times, and spend analysis"
        icon={Star}
        iconColor="bg-amber-600"
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Active Suppliers</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{isLoading ? '...' : data?.activeSuppliers ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Total Spend</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{isLoading ? '...' : formatCurrency(data?.totalSpend ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">On-Time Delivery</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{isLoading ? '...' : `${(data?.onTimeDelivery ?? 0).toFixed(1)}%`}</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} type="cards" />
      ) : suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s, i) => (
            <div key={i} className={`rounded-xl border ${ratingBg(s.onTimeDelivery)} bg-white p-5 transition-all hover:shadow-md`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.supplierName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.totalOrders} orders placed</p>
                </div>
                <div className={`text-lg ${ratingColor(s.onTimeDelivery)}`} title={`${s.onTimeDelivery.toFixed(0)}% on-time`}>
                  {stars(s.onTimeDelivery)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Total Spend</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(s.totalSpend)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg Lead Time</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Clock size={13} className="text-gray-400" />
                    {s.avgLeadTime.toFixed(1)} days
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">On-Time Delivery</span>
                  <span className={`font-semibold ${ratingColor(s.onTimeDelivery)}`}>{s.onTimeDelivery.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.onTimeDelivery >= 90 ? 'bg-emerald-500' : s.onTimeDelivery >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${s.onTimeDelivery}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Star} title="No supplier data" description="No supplier performance data for this period." />
      )}
    </div>
  )
}
