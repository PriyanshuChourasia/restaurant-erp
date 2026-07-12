import { UtensilsCrossed, Leaf, Drumstick } from 'lucide-react'
import { usePopularItems, useVegNonVegSplit } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function PopularItemsPage() {
  const { fromDate, toDate } = useDateRange('month')
  const { data: popular, isLoading: popularLoading } = usePopularItems(fromDate, toDate, 20)
  const { data: split } = useVegNonVegSplit(fromDate, toDate)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Popular Items"
        description="Most ordered menu items and dietary mix"
        icon={UtensilsCrossed}
        iconColor="bg-blue-600"
      >
        <DateRangeFilter value={{ fromDate, toDate }} onChange={() => {}} />
      </ReportPageHeader>

      {/* Veg vs Non-Veg KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Veg Revenue"
          value={`₹${Number(split?.veg?.revenue || 0).toLocaleString('en-IN')}`}
          subtitle={`${split?.veg?.percentage?.toFixed(1) || 0}% of total`}
          color="emerald"
        />
        <KpiCard
          label="Non-Veg Revenue"
          value={`₹${Number(split?.nonVeg?.revenue || 0).toLocaleString('en-IN')}`}
          subtitle={`${split?.nonVeg?.percentage?.toFixed(1) || 0}% of total`}
          color="red"
        />
        <KpiCard
          label="Veg Items Sold"
          value={String(split?.veg?.quantitySold || 0)}
          subtitle="total quantity"
          color="emerald"
        />
        <KpiCard
          label="Non-Veg Items Sold"
          value={String(split?.nonVeg?.quantitySold || 0)}
          subtitle="total quantity"
          color="red"
        />
      </div>

      {/* Top Items Table */}
      <ReportCard title="Top Items by Quantity Sold">
        {popularLoading ? <LoadingSkeleton rows={10} /> : popular?.items && popular.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Times Ordered</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Avg Qty/Order</th>
                </tr>
              </thead>
              <tbody>
                {popular.items.map((item) => (
                  <tr key={item.itemId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-400 font-medium">{item.rank}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.isVeg ? (
                          <Leaf size={14} className="text-green-600 shrink-0" />
                        ) : (
                          <Drumstick size={14} className="text-red-500 shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.categoryName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.quantitySold}</td>
                    <td className="py-3 px-4 text-right text-gray-700">₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.timesOrdered}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.avgQuantityPerOrder.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No item data for selected period</p>
        )}
      </ReportCard>

      {/* Veg vs Non-Veg Split Bar */}
      {split && (
        <ReportCard title="Dietary Mix">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5 text-gray-600"><Leaf size={14} className="text-green-600" /> Veg</span>
                <span className="font-medium text-gray-900">{split.veg.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-6 bg-gray-50 rounded-lg overflow-hidden">
                <div className="h-full bg-green-500 rounded-lg" style={{ width: `${split.veg.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5 text-gray-600"><Drumstick size={14} className="text-red-500" /> Non-Veg</span>
                <span className="font-medium text-gray-900">{split.nonVeg.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-6 bg-gray-50 rounded-lg overflow-hidden">
                <div className="h-full bg-red-500 rounded-lg" style={{ width: `${split.nonVeg.percentage}%` }} />
              </div>
            </div>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
