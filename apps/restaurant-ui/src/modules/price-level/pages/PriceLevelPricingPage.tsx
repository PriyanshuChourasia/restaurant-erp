import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Search, IndianRupee } from 'lucide-react'
import { usePricingGrid, useSaveBulkPricing, usePriceLevel } from '../hooks/usePriceLevelQueries'
import type { PricingGridRow } from '../types/price-level.types'

interface PriceLevelPricingPageProps {
  priceLevelId: string
}

export function PriceLevelPricingPage({ priceLevelId }: PriceLevelPricingPageProps) {
  const navigate = useNavigate()
  const { data: priceLevel } = usePriceLevel(priceLevelId)
  const { data: gridData, isLoading } = usePricingGrid(priceLevelId)
  const saveMutation = useSaveBulkPricing()

  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [showOnlyOverridden, setShowOnlyOverridden] = useState(false)
  const [saved, setSaved] = useState(false)

  // Initialize edits from grid data
  const getPriceValue = useCallback(
    (row: PricingGridRow) => {
      const key = row.itemId
      if (key in priceEdits) return priceEdits[key]
      return row.overridePrice !== null ? String(row.overridePrice) : ''
    },
    [priceEdits],
  )

  const handlePriceChange = useCallback((itemId: string, value: string) => {
    setPriceEdits((prev) => ({ ...prev, [itemId]: value }))
  }, [])

  const filteredRows = (gridData || []).filter((row) => {
    const matchesSearch =
      row.itemName.toLowerCase().includes(search.toLowerCase()) ||
      row.sku.toLowerCase().includes(search.toLowerCase())
    const matchesOverride = showOnlyOverridden ? row.isOverridden || !!priceEdits[row.itemId] : true
    return matchesSearch && matchesOverride
  })

  const handleSave = async () => {
    const items = Object.entries(priceEdits)
      .filter(([, value]) => value !== '' && !isNaN(Number(value)) && Number(value) >= 0)
      .map(([itemId, value]) => ({
        itemId,
        price: Number(value),
      }))

    if (items.length === 0 && !Object.keys(priceEdits).some((k) => priceEdits[k])) return

    await saveMutation.mutateAsync({
      priceLevelId,
      payload: { items },
    })
    setPriceEdits({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/price-levels' })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {priceLevel?.name || 'Price Level'} — Pricing Grid
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set custom prices for items at this price level. Empty = uses base price.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || Object.keys(priceEdits).length === 0}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Success message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
          ✓ Prices saved successfully!
        </div>
      )}

      {/* Search and filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyOverridden}
            onChange={(e) => setShowOnlyOverridden(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-600">Overrides only</span>
        </label>
      </div>

      {/* Pricing table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Item
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Base Price
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Override Price
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Effective
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <p className="text-sm text-gray-400">
                    {search ? 'No items match your search.' : 'No items found.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const editValue = getPriceValue(row)
                const hasEdit = editValue !== ''
                const effectivePrice = hasEdit ? Number(editValue) : row.basePrice
                const isDifferent = hasEdit && Number(editValue) !== row.basePrice

                return (
                  <tr key={row.itemId} className={`transition-colors hover:bg-gray-50/80 ${isDifferent ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{row.itemName}</p>
                        <p className="text-xs text-gray-400">
                          {row.sku} · {row.unit} · GST {row.gstRate}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {row.categoryName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-700 font-medium">
                        ₹{row.basePrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <IndianRupee size={12} className="text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Base"
                          value={editValue}
                          onChange={(e) => handlePriceChange(row.itemId, e.target.value)}
                          className={`w-24 h-8 rounded-lg border px-2.5 text-sm text-right outline-none ${
                            isDifferent
                              ? 'border-amber-300 bg-amber-50 focus:border-amber-500'
                              : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${isDifferent ? 'text-primary' : 'text-gray-500'}`}>
                        ₹{effectivePrice.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
