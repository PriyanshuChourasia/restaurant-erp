import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus, Search, CheckCircle2, XCircle, AlertTriangle, Package, Scale, Eye, ChevronRight, Warehouse, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'
import { useStockCounts, useStockCount, useCreateStockCount, useCompleteStockCount, useSubmitStockCountLines } from '../hooks/useInventoryQueries'
import { DataTable } from '@/components/ui/data-table'
import type { StockCount, StockCountLine } from '../api/inventory.api'
import type { StorageUnit } from '../types/inventory.types'

const columnHelper = createColumnHelper<StockCount>()

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed': return 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'
    default: return 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700'
  }
}

function getVarianceCount(lines: StockCountLine[]): { over: number; under: number; exact: number } {
  let over = 0, under = 0, exact = 0
  for (const l of lines) {
    if (l.countedQuantity == null) continue
    if (l.variance! > 0) over++
    else if (l.variance! < 0) under++
    else exact++
  }
  return { over, under, exact }
}

function getStorageUnits(): Promise<StorageUnit[]> {
  return apiClient.get('/storage-units').then((res) => res.data)
}

function getItems(params?: { page?: number; limit?: number; search?: string }): Promise<{ items: any[] }> {
  return apiClient.get('/items', { params }).then((res) => res.data)
}

export function StockCountPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCountId, setSelectedCountId] = useState<string | null>(null)

  const { data, isLoading } = useStockCounts({ page, limit: 20 })
  const counts = data?.data || []
  const total = data?.total || 0

  // Fetch full detail when a count is selected
  const { data: selectedCount } = useStockCount(selectedCountId || '')

  const columns = useMemo<ColumnDef<StockCount, any>[]>(
    () => [
      columnHelper.accessor('countDate', {
        header: 'Date',
        cell: (info) => {
          const d = new Date(info.getValue())
          return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        },
      }),
      columnHelper.accessor('storageUnit', {
        header: 'Storage Unit',
        cell: (info) => info.getValue()?.name || '-',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={statusBadgeClass(info.getValue())}>
            {info.getValue() === 'completed' ? <CheckCircle2 size={12} /> : <ClockIcon size={12} />}
            {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'variance',
        header: 'Variance',
        cell: () => <span className="text-xs text-gray-400">View details</span>,
      }),
      columnHelper.accessor('notes', {
        header: 'Notes',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setSelectedCountId(row.id === selectedCountId ? null : row.id)}
                className="h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all inline-flex items-center gap-1"
              >
                <Eye size={13} />
                View
              </button>
            </div>
          )
        },
      }),
    ],
    [selectedCountId],
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Counts</h1>
          <p className="text-sm text-gray-500 mt-1">Physical stock reconciliation — count items, record variances, and post adjustments.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90"
        >
          <Plus size={15} />
          New Count
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search stock counts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
        />
      </div>

      {/* Main content: table + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable<StockCount>
            columns={columns}
            data={counts}
            total={total}
            page={page}
            pageSize={20}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyMessage="No stock counts yet. Start a new count to reconcile physical inventory."
          />
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selectedCount ? (
            <StockCountDetail
              count={selectedCount}
              onClose={() => setSelectedCountId(null)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <div className="flex items-center justify-center h-12 w-12 mx-auto mb-3 rounded-xl bg-gray-100 text-gray-400">
                <Eye size={24} />
              </div>
              <p className="text-sm font-medium text-gray-500">Select a stock count</p>
              <p className="text-xs text-gray-400 mt-1">Click "View" on any count to see details and complete it.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create count dialog */}
      {showCreate && (
        <CreateStockCountDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// ── Clock Icon ────────────────────────────────────────────────────

function ClockIcon({ size }: { size?: number }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Stock Count Detail Panel ──────────────────────────────────────

function StockCountDetail({ count, onClose }: { count: StockCount; onClose: () => void }) {
  const submitMutation = useSubmitStockCountLines()
  const completeMutation = useCompleteStockCount()
  const [countedValues, setCountedValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(count.status === 'completed')

  const lines = count.lines || []
  const vars = getVarianceCount(lines)
  const totalVariance = lines.reduce((s, l) => s + (l.variance || 0), 0)
  const isComplete = count.status === 'completed'

  // Initialize counted values from existing data
  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const l of lines) {
      initial[l.id] = l.countedQuantity?.toString() ?? ''
    }
    setCountedValues(initial)
  }, [count.id])

  const allEntered = lines.every((l) => {
    const val = countedValues[l.id]
    return val !== undefined && val !== '' && !isNaN(parseFloat(val)) && parseFloat(val) >= 0
  })

  const hadCountedQuantity = lines.every((l) => l.countedQuantity != null)

  const handleSubmitAndComplete = async () => {
    setError(null)
    if (!allEntered && !hadCountedQuantity) return

    try {
      // Step 1: Submit lines if any values have changed or haven't been submitted
      if (!hadCountedQuantity) {
        const linesToSubmit = lines.map((l) => ({
          lineId: l.id,
          countedQuantity: parseFloat(countedValues[l.id]),
        }))
        setIsSubmitting(true)
        await submitMutation.mutateAsync({ stockCountId: count.id, lines: linesToSubmit })
        setIsSubmitting(false)
      }

      // Step 2: Complete the count (mutation's onSuccess handles invalidation)
      await completeMutation.mutateAsync(count.id)
      setCompleted(true)
    } catch (err: any) {
      setIsSubmitting(false)
      setError(err?.response?.data?.message || err?.message || 'Failed to complete count')
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Count Details</h3>
          <p className="text-xs text-gray-400">
            {new Date(count.countDate).toLocaleDateString('en-IN')} &middot; {count.storageUnit?.name || 'Unknown location'}
          </p>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
          <XCircle size={16} />
        </button>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-gray-600">
            {lines.length} items
          </span>
          <span className="text-gray-300">|</span>
          {vars.over > 0 && <span className="text-emerald-600 font-medium">+{vars.over} over</span>}
          {vars.under > 0 && <span className="text-red-600 font-medium">-{vars.under} under</span>}
          {vars.exact > 0 && <span className="text-gray-400">{vars.exact} exact</span>}
          {(vars.over > 0 || vars.under > 0) && (
            <>
              <span className="text-gray-300">|</span>
              <span className={`font-medium ${totalVariance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Lines */}
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
        {lines.map((line: StockCountLine) => {
          const hasVariance = line.countedQuantity != null && line.variance !== 0
          const isPos = line.variance != null && line.variance > 0
          const inputValue = countedValues[line.id] ?? ''

          return (
            <div key={line.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                  {line.item?.name || line.itemId.slice(0, 8)}
                </span>
                {hasVariance && (
                  <span className={`text-xs font-semibold ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPos ? '+' : ''}{line.variance!.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">Sys: {line.systemQuantity}</span>
                {isComplete || completed ? (
                  <span className={`font-medium ${hasVariance ? (isPos ? 'text-emerald-600' : 'text-red-600') : 'text-gray-500'}`}>
                    Counted: {line.countedQuantity}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Counted"
                      value={inputValue}
                      onChange={(e) => setCountedValues((prev) => ({ ...prev, [line.id]: e.target.value }))}
                      className={`w-20 h-6 rounded border px-2 text-xs text-gray-700 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 ${
                        line.countedQuantity != null && inputValue === line.countedQuantity?.toString()
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-gray-200'
                      }`}
                      disabled={isComplete || completed}
                    />
                    {line.countedQuantity != null && (
                      <span className="text-emerald-600 font-medium">
                        (saved: {line.countedQuantity})
                      </span>
                    )}
                  </div>
                )}
                {line.notes && <span className="text-gray-400 truncate max-w-[80px]">· {line.notes}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        {isComplete || completed ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-xs font-medium">
            <CheckCircle2 size={14} />
            Completed — adjustments posted with variances
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {error && (
              <div className="flex items-center gap-1.5 text-red-600 bg-red-50 rounded-lg px-3 py-2 text-xs">
                <AlertTriangle size={12} />
                {error}
              </div>
            )}
            <button
              onClick={handleSubmitAndComplete}
              disabled={!allEntered || isSubmitting || completeMutation.isPending}
              className={`w-full h-8 rounded-lg text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                !allEntered
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isSubmitting ? (
                <>Submitting counts...</>
              ) : completeMutation.isPending ? (
                <>Posting adjustments...</>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Complete Count & Post Adjustments
                </>
              )}
            </button>
            {!allEntered && (
              <p className="text-xs text-gray-400 text-center">Enter counted quantities for all lines before completing.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Create Stock Count Dialog ─────────────────────────────────────

function CreateStockCountDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'select-items' | 'review'>('select-items')
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [searchItems, setSearchItems] = useState('')
  const [countNotes, setCountNotes] = useState('')
  const [selectedStorageUnitId, setSelectedStorageUnitId] = useState<string>('')
  const [, setError] = useState<string | null>(null)

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', 'all-for-stock-count'],
    queryFn: () => getItems({ limit: 200 }),
  })
  const items = itemsData?.items || []

  const { data: storageUnits, isLoading: unitsLoading } = useQuery({
    queryKey: ['storage-units'],
    queryFn: () => getStorageUnits(),
  })

  const createMutation = useCreateStockCount()

  // Auto-select default storage unit
  useEffect(() => {
    if (storageUnits && storageUnits.length > 0 && !selectedStorageUnitId) {
      const defaultUnit = storageUnits.find((u) => u.isDefault)
      if (defaultUnit) setSelectedStorageUnitId(defaultUnit.id)
      else setSelectedStorageUnitId(storageUnits[0].id)
    }
  }, [storageUnits, selectedStorageUnitId])

  const filteredItems = useMemo(
    () => items.filter(
      (i: any) => !searchItems || i.name.toLowerCase().includes(searchItems.toLowerCase()),
    ),
    [items, searchItems],
  )

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleCreate = async () => {
    if (!selectedItemIds.length || !selectedStorageUnitId) return
    try {
      setError(null)
      await createMutation.mutateAsync({
        storageUnitId: selectedStorageUnitId,
        itemIds: selectedItemIds,
        notes: countNotes || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create count')
    }
  }

  const loading = itemsLoading || unitsLoading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Dialog header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">New Stock Count</h2>
              <p className="text-xs text-gray-400">Select items and location to count</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <XCircle size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Storage unit selector */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Storage Unit *</label>
                <div className="relative">
                  <Warehouse size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedStorageUnitId}
                    onChange={(e) => setSelectedStorageUnitId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10 bg-white appearance-none cursor-pointer"
                  >
                    {!selectedStorageUnitId && <option value="">Select location...</option>}
                    {(storageUnits || []).map((u: StorageUnit) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {step === 'select-items' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchItems}
                      onChange={(e) => setSearchItems(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-1 max-h-[250px] overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No items found</p>
                    ) : (
                      filteredItems.map((item: any) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedItemIds.includes(item.id) ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.sku || 'No SKU'}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span>{selectedItemIds.length} selected</span>
                    <button
                      onClick={() => setSelectedItemIds(items.map((i: any) => i.id))}
                      className="text-primary hover:underline"
                    >
                      Select all
                    </button>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                    <AlertTriangle size={14} className="inline mr-1" />
                    A draft stock count will be created with system quantities snapshotted. You&apos;ll enter physical counts and post adjustments.
                  </div>
                  <p className="text-sm font-medium text-gray-700">Selected items ({selectedItemIds.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.filter((i: any) => selectedItemIds.includes(i.id)).map((item: any) => (
                      <span key={item.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                        <Package size={10} />
                        {item.name}
                      </span>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      placeholder="e.g. Monthly stock take"
                      className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          {step === 'select-items' ? (
            <>
              <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={() => selectedItemIds.length > 0 && setStep('review')}
                disabled={!selectedItemIds.length || !selectedStorageUnitId}
                className={`h-9 px-4 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                  selectedItemIds.length && selectedStorageUnitId ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Review <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('select-items')} className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 inline-flex items-center gap-1.5"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Count'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
