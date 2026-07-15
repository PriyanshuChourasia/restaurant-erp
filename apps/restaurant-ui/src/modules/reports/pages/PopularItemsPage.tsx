import { UtensilsCrossed, Leaf, Drumstick, Trophy } from 'lucide-react'
import { usePopularItems, useVegNonVegSplit } from '../hooks/useReportQueries'
import { ReportPageHeader, KpiCard, ReportCard, LoadingSkeleton, EmptyState, formatCurrency, HorizontalBarChart, SectionHeader } from '../components/ReportComponents'
import { useDateRange, DateRangeFilter } from '../components/DateRangeFilter'

export function PopularItemsPage() {
  const { fromDate, toDate, preset, setPreset, setCustom } = useDateRange('month')
  const { data: popular, isLoading: popularLoading } = usePopularItems(fromDate, toDate, 20)
  const { data: split } = useVegNonVegSplit(fromDate, toDate)

  const topItem = popular?.items?.length ? popular.items[0] : null

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Popular Items"
        description="Most ordered menu items and dietary mix"
        icon={UtensilsCrossed}
        iconColor="bg-pink-600"
        badge={popular?.items?.length ? { label: `${popular.items.length} items tracked`, color: 'bg-pink-100 text-pink-700' } : undefined}
      >
        <DateRangeFilter
          value={{ fromDate, toDate }}
          onChange={setCustom}
          activePreset={preset}
          onPresetChange={setPreset}
        />
      </ReportPageHeader>

      {/* Veg vs Non-Veg KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Veg Revenue"
          value={formatCurrency(split?.veg?.revenue || 0)}
          subtitle={`${split?.veg?.percentage?.toFixed(1) || 0}% of total`}
          icon={Leaf}
          color="emerald"
        />
        <KpiCard
          label="Non-Veg Revenue"
          value={formatCurrency(split?.nonVeg?.revenue || 0)}
          subtitle={`${split?.nonVeg?.percentage?.toFixed(1) || 0}% of total`}
          icon={Drumstick}
          color="red"
        />
        <KpiCard
          label="Veg Items Sold"
          value={String(split?.veg?.quantitySold || 0)}
          subtitle="total quantity"
          icon={Leaf}
          color="emerald"
        />
        <KpiCard
          label="Non-Veg Items Sold"
          value={String(split?.nonVeg?.quantitySold || 0)}
          subtitle="total quantity"
          icon={Drumstick}
          color="red"
        />
      </div>

      {/* Top Item Highlight */}
      {topItem && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">#1 Most Popular Item</p>
              <p className="text-lg font-bold text-amber-900">
                {topItem.itemName} — {topItem.quantitySold} sold · {formatCurrency(topItem.revenue)} revenue
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {topItem.isVeg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'} · Ordered {topItem.timesOrdered} times · {topItem.avgQuantityPerOrder.toFixed(1)} avg per order
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items Table - takes 2 cols */}
        <ReportCard title="Top Items by Quantity Sold" subtitle={`Showing top ${Math.min(popular?.items?.length || 0, 20)} items`} className="lg:col-span-2">
          {popularLoading ? (
            <LoadingSkeleton rows={10} />
          ) : popular?.items && popular.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase w-10">#</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Times Ordered</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Avg Qty</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {popular.items.map((item) => {
                    const maxQty = popular.items[0]?.quantitySold || 1
                    const barWidth = (item.quantitySold / maxQty) * 100
                    const isTop3 = item.rank <= 3
                    return (
                      <tr key={item.itemId} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold ${isTop3 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {item.isVeg ? (
                              <Leaf size={13} className="text-green-600 shrink-0" />
                            ) : (
                              <Drumstick size={13} className="text-red-500 shrink-0" />
                            )}
                            <span className={`font-medium ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>{item.itemName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">{item.categoryName}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">{item.quantitySold}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.revenue)}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{item.timesOrdered}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{item.avgQuantityPerOrder.toFixed(1)}</td>
                        <td className="py-3 px-3">
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isTop3 ? 'bg-amber-500' : 'bg-gray-300'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={UtensilsCrossed} title="No item data" description="No orders found for the selected period" />
          )}
        </ReportCard>

        {/* Dietary Mix */}
        <ReportCard title="Dietary Mix" subtitle="Veg vs Non-Veg breakdown">
          {split ? (
            <div className="space-y-6">
              {/* Revenue Split */}
              <div>
                <SectionHeader title="Revenue Split" />
                <HorizontalBarChart
                  segments={[
                    { label: 'Veg', value: split.veg.revenue, color: 'bg-emerald-500' },
                    { label: 'Non-Veg', value: split.nonVeg.revenue, color: 'bg-red-500' },
                  ]}
                  height="h-10"
                />
              </div>

              {/* Quantity Split */}
              <div>
                <SectionHeader title="Quantity Split" />
                <HorizontalBarChart
                  segments={[
                    { label: 'Veg', value: split.veg.quantitySold, color: 'bg-emerald-400' },
                    { label: 'Non-Veg', value: split.nonVeg.quantitySold, color: 'bg-red-400' },
                  ]}
                  height="h-10"
                />
              </div>

              {/* Stats */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Veg Revenue Share</span>
                  <span className="text-sm font-semibold text-emerald-700">{split.veg.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Non-Veg Revenue Share</span>
                  <span className="text-sm font-semibold text-red-700">{split.nonVeg.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Grand Total</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(split.grandTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={UtensilsCrossed} title="No split data" description="Select a period with sales data" />
          )}
        </ReportCard>
      </div>
    </div>
  )
}
