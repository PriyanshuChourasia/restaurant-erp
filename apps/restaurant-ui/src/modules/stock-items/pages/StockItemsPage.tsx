import { useState, useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Search, Package, Hash, Archive } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getStockItems } from '../api/stock-items.api'
import type { StockItemRow } from '../api/stock-items.api'
import { DataTable } from '@/components/ui/data-table'

const GROUP_OPTIONS = [
  { value: '', label: 'All Groups' },
  { value: 'RM', label: 'Raw Mat.' },
  { value: 'FG', label: 'Finished' },
  { value: 'PKG', label: 'Packaging' },
]

const columnHelper = createColumnHelper<StockItemRow>()

const groupBadge = (code: string | undefined) => {
  switch (code) {
    case 'RM': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'FG': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'PKG': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function StockItemsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-items', page, search, groupFilter],
    queryFn: () => getStockItems({
      page,
      limit: 20,
      search: search || undefined,
      group: groupFilter || undefined,
    }),
  })

  const items = data?.items || []
  const total = data?.total || 0

  const columns = useMemo<ColumnDef<StockItemRow, any>[]>(
    () => [
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
              <Hash size={15} />
            </div>
            <span className="font-mono text-sm font-semibold text-gray-900">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <p className="font-medium text-gray-900">{info.getValue()}</p>
              {row.alias && <p className="text-[11px] text-gray-400">{row.alias}</p>}
            </div>
          )
        },
      }),
      columnHelper.accessor('stockGroup', {
        header: 'Group',
        cell: (info) => {
          const group = info.getValue()
          if (!group) return <span className="text-xs text-gray-400">—</span>
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${groupBadge(group.code)}`}>
              {group.code}
            </span>
          )
        },
      }),
      columnHelper.accessor('stockCategory', {
        header: 'Category',
        cell: (info) => {
          const cat = info.getValue()
          return cat ? (
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{cat.name}</span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )
        },
      }),
      columnHelper.accessor('unitOfMeasure', {
        header: 'UOM',
        cell: (info) => {
          const uom = info.getValue()
          return uom ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              <Package size={11} className="text-gray-400" />
              {uom.code}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )
        },
      }),
      columnHelper.accessor('hsnCode', {
        header: 'HSN',
        cell: (info) => info.getValue()
          ? <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{info.getValue()}</span>
          : <span className="text-xs text-gray-300">—</span>,
      }),
      columnHelper.accessor('gstRate', {
        header: 'GST',
        cell: (info) => info.getValue() != null
          ? <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{info.getValue()}%</span>
          : <span className="text-xs text-gray-300">—</span>,
      }),
      columnHelper.accessor('reorderLevel', {
        header: 'Reorder',
        cell: (info) => {
          const val = info.getValue()
          const row = info.row.original
          return val != null && val > 0
            ? <span className="text-sm text-gray-900">{val} {row.unitOfMeasure?.code || ''}</span>
            : <span className="text-xs text-gray-300">—</span>
        },
      }),
      columnHelper.accessor('barcode', {
        header: 'Barcode',
        cell: (info) => info.getValue()
          ? <span className="text-xs text-gray-500 font-mono">{info.getValue()}</span>
          : <span className="text-xs text-gray-300">—</span>,
      }),
      columnHelper.accessor('trackBatch', {
        header: 'Tracking',
        cell: (info) => {
          const batch = info.getValue()
          const expiry = info.row.original.trackExpiry
          if (!batch && !expiry) return <span className="text-xs text-gray-300">—</span>
          return (
            <div className="flex gap-1">
              {batch && <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-medium">Batch</span>}
              {expiry && <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium">Expiry</span>}
            </div>
          )
        },
      }),
    ],
    [],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Archive size={24} className="text-primary" />
            Stock Items
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All inventoried items from the stock master — raw materials, finished goods, and packaging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {/* Group Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {GROUP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setGroupFilter(opt.value); setPage(1) }}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              groupFilter === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stock Items Table */}
      <DataTable<StockItemRow>
        columns={columns}
        data={items}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          search || groupFilter
            ? 'No stock items match your filters.'
            : 'No stock items found. Seed data or add items to get started.'
        }
      />
    </div>
  )
}
