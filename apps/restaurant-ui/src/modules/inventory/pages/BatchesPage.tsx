import { useState, useMemo } from 'react'
import { useAllBatches, useNearExpiryBatches } from '../hooks/useInventoryQueries'
import {
  Package, AlertTriangle, Clock, Layers,
  Search, Loader2, ChevronDown, ChevronRight,
  ListFilter,
} from 'lucide-react'
import type { StockBatch } from '../types/inventory.types'
import {
  STATUS_CONFIG,
  STATUS_FILTER_OPTIONS,
  daysUntil,
  formatDate,
  BatchExpiryBadge,
} from '../utils/batch-utils'
import type { BatchStatus } from '../utils/batch-utils'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

export function BatchesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const { data: allBatches, isLoading: batchesLoading } = useAllBatches()
  const { data: nearExpiry, isLoading: expiryLoading } = useNearExpiryBatches(30) // 30-day lookahead

  // ── Derived data ──────────────────────────────────────────

  const filteredBatches = useMemo(() => {
    if (!allBatches) return []
    let list = [...allBatches]

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(q) ||
          b.item?.name?.toLowerCase().includes(q) ||
          b.item?.sku?.toLowerCase().includes(q),
      )
    }
    return list
  }, [allBatches, statusFilter, search])

  const criticalExpiry = useMemo(
    () => (nearExpiry || []).filter((b) => {
      const d = daysUntil(b.expiryDate)
      return d !== null && d <= 7
    }),
    [nearExpiry],
  )

  const warningExpiry = useMemo(
    () => (nearExpiry || []).filter((b) => {
      const d = daysUntil(b.expiryDate)
      return d !== null && d > 7 && d <= 30
    }),
    [nearExpiry],
  )

  const itemsWithBatches = useMemo(() => {
    if (!allBatches) return []
    const itemMap = new Map<string, { name: string; sku: string; batches: StockBatch[] }>()
    for (const batch of allBatches) {
      const id = batch.itemId
      if (!itemMap.has(id)) {
        itemMap.set(id, {
          name: batch.item?.name || 'Unknown',
          sku: batch.item?.sku || '-',
          batches: [],
        })
      }
      itemMap.get(id)!.batches.push(batch)
    }
    return Array.from(itemMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name))
  }, [allBatches])

  const batchTotals = useMemo(() => {
    if (!allBatches) return { total: 0, active: 0, expired: 0, exhausted: 0 }
    return {
      total: allBatches.length,
      active: allBatches.filter((b) => b.status === 'active').length,
      expired: allBatches.filter((b) => b.status === 'expired').length,
      exhausted: allBatches.filter((b) => b.status === 'exhausted').length,
    }
  }, [allBatches])

  const isLoading = batchesLoading || expiryLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers size={24} className="text-primary" /> Batch Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track stock batches by lot number, monitor expiry dates, and manage inventory ageing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Batches</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"><Layers size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : batchTotals.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-emerald-600">Active</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Package size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{isLoading ? '...' : batchTotals.active}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-amber-600">Expiring Soon</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white"><Clock size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{isLoading ? '...' : criticalExpiry.length + warningExpiry.length}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-red-600">Exhausted</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-red-600">{isLoading ? '...' : batchTotals.exhausted}</p>
        </div>
      </div>

      {/* Near-Expiry Alerts */}
      {!expiryLoading && (criticalExpiry.length > 0 || warningExpiry.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Expiry Alerts</h3>
            <span className="text-xs text-amber-600 font-medium ml-auto">
              {criticalExpiry.length} critical · {warningExpiry.length} within 30 days
            </span>
          </div>

          {criticalExpiry.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-2 uppercase tracking-wider">⚠ Critical (within 7 days)</p>
              <div className="grid gap-2">
                {criticalExpiry.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between bg-white rounded-lg border border-red-200 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{batch.item?.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{batch.batchNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {batch.quantityRemaining} <span className="text-xs text-gray-400 font-normal">remaining</span>
                      </span>
                      <BatchExpiryBadge expiryDate={batch.expiryDate} />
                      <span className="text-xs text-gray-400">Exp: {formatDate(batch.expiryDate!)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warningExpiry.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 mb-2 uppercase tracking-wider">⚠ Warning (within 30 days)</p>
              <div className="grid gap-2">
                {warningExpiry.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{batch.item?.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{batch.batchNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {batch.quantityRemaining} <span className="text-xs text-gray-400 font-normal">remaining</span>
                      </span>
                      <BatchExpiryBadge expiryDate={batch.expiryDate} />
                    </div>
                  </div>
                ))}
                {warningExpiry.length > 5 && (
                  <p className="text-xs text-amber-600 text-center">
                    +{warningExpiry.length - 5} more batches expiring within 30 days
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!expiryLoading && criticalExpiry.length === 0 && warningExpiry.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 flex items-center gap-3">
          <Package size={18} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">No batches are expiring within the next 30 days.</p>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <ListFilter size={15} className="text-gray-400" />
        {STATUS_FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Batches List - Grouped by Item */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : filteredBatches.length > 0 ? (
        <div className="space-y-3">
          {itemsWithBatches.map(([itemId, itemInfo]) => {
            const itemBatches = itemInfo.batches
            const filteredItemBatches = statusFilter === 'all'
              ? itemBatches
              : itemBatches.filter((b) => b.status === statusFilter)

            if (filteredItemBatches.length === 0) return null

            const isExpanded = expandedItem === itemId
            const activeCount = itemBatches.filter((b) => b.status === 'active').length
            const totalRemaining = itemBatches.reduce((s, b) => s + b.quantityRemaining, 0)

            return (
              <div key={itemId} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                {/* Item Header (clickable) */}
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : itemId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{itemInfo.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{itemInfo.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers size={12} />
                        {itemBatches.length} batches
                      </span>
                      <span className="flex items-center gap-1">
                        <Package size={12} />
                        <FormattedQuantity quantity={totalRemaining} unit={itemsWithBatches.find(([id]) => id === itemId)?.[1]?.batches?.[0]?.item?.unit?.code || ''} variant="compact" />
                      </span>
                      {activeCount > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {activeCount} active
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Batch rows (expandable) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {filteredItemBatches.map((batch) => {
                      const config = STATUS_CONFIG[batch.status as BatchStatus] || STATUS_CONFIG.active

      // This comment ensures the next edit has enough context
                      return (
                        <div key={batch.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {batch.batchNumber}
                                </code>
                                <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${config.class}`}>
                                  {config.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>Received: {formatDate(batch.receivedDate)}</span>
                                {batch.expiryDate && <span>Expires: {formatDate(batch.expiryDate)}</span>}
                                {batch.storageUnit && <span>@{batch.storageUnit.name}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                <FormattedQuantity quantity={batch.quantityRemaining} unit={batch.item?.unit?.code || ''} variant="full" />
                                <span className="text-xs text-gray-400 font-normal">
                                  {' / '}<FormattedQuantity quantity={batch.quantityReceived} unit={batch.item?.unit?.code || ''} variant="full" />
                                </span>
                              </p>
                              <p className="text-xs text-gray-400">₹{Number(batch.unitCost).toFixed(2)}/unit</p>
                            </div>
                            <BatchExpiryBadge expiryDate={batch.expiryDate} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Layers size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No batches found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Batches are created automatically when stock is received via purchases.'}
          </p>
        </div>
      )}
    </div>
  )
}
