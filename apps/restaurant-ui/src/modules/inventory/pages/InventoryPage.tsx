import { useState, useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Package, AlertTriangle, Filter, ArrowLeftRight } from 'lucide-react'
import { useInventory, useLowStock } from '../hooks/useInventoryQueries'
import { DataTable } from '@/components/ui/data-table'
import { AdjustStockDialog } from '../dialogs/AdjustStockDialog'
import { StockHistoryDialog } from '../dialogs/StockHistoryDialog'
import { AddInventoryItemDialog } from '../dialogs/AddInventoryItemDialog'
import { UnitConversionWidget } from '@/modules/units/components/UnitConversionWidget'
import { ViewBatchesDialog } from '../dialogs/ViewBatchesDialog'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

interface InventoryRow {
  id: string
  itemId: string
  itemName: string
  categoryName: string | null
  sku: string
  currentStock: number
  minStockLevel: number
  unitCost: number
  unit: string
  status: string
}

const columnHelper = createColumnHelper<InventoryRow>()

function getStockStatus(item: { currentStock: number; minStockLevel: number }) {
  if (item.minStockLevel <= 0) return 'Ok'
  if (item.currentStock <= 0) return 'Critical'
  if (item.currentStock < item.minStockLevel) return 'Low'
  return 'Ok'
}

const stockBadgeClass = (status: string) => {
  switch (status) {
    case 'Critical': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700'
    case 'Low': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700'
    default: return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'
  }
}

export function InventoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InventoryRow | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [convertTarget, setConvertTarget] = useState<InventoryRow | null>(null)
  const [batchesTarget, setBatchesTarget] = useState<InventoryRow | null>(null)

  const { data, isLoading } = useInventory({ page, limit: 20, search: search || undefined, status: statusFilter || undefined })
  const { data: lowStockData } = useLowStock()

  const rawItems = data?.data || []
  const total = data?.total || 0
  const lowStockCount = lowStockData?.length || 0
  const criticalCount = lowStockData?.filter((item: any) => item.currentStock === 0 || (item.minStockLevel > 0 && item.currentStock / item.minStockLevel <= 0.25)).length || 0

  const inventoryRows: InventoryRow[] = useMemo(
    () =>
      rawItems.map((item: any) => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.item?.name || 'Unknown',
        categoryName: item.item?.category?.name || null,
        sku: item.item?.sku || '-',
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        unitCost: Number(item.unitCost || 0),
        unit: item.item?.unit?.code || item.item?.unit?.name || '',
        status: getStockStatus(item),
      })),
    [rawItems],
  )

  const columns = useMemo<ColumnDef<InventoryRow, any>[]>(
    () => [
      columnHelper.accessor('itemName', {
        header: 'Item',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <p className="font-medium text-gray-900">{info.getValue()}</p>
              {row.categoryName && <p className="text-xs text-gray-400">{row.categoryName}</p>}
            </div>
          )
        },
      }),
      columnHelper.accessor('sku', { header: 'SKU' }),
      columnHelper.accessor('currentStock', {
        header: 'Stock',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                <FormattedQuantity quantity={info.getValue()} unit={row.unit} variant="full" />
              </span>
              {row.unit && (
                <button
                  onClick={() => setConvertTarget(row)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-300 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                  title="Convert units"
                >
                  <ArrowLeftRight size={12} />
                </button>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('minStockLevel', {
        header: 'Min Level',
        cell: (info) => {
          const row = info.row.original
          return info.getValue() > 0
            ? <FormattedQuantity quantity={info.getValue()} unit={row.unit} variant="full" />
            : '-'
        },
      }),
      columnHelper.accessor('unitCost', {
        header: 'Unit Cost',
        cell: (info) => `₹${info.getValue().toFixed(2)}`,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={stockBadgeClass(info.getValue())}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setAdjustTarget(row)}
                className="h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                Adjust
              </button>
              <button
                onClick={() => setBatchesTarget(row)}
                className="h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                Batches
              </button>
              <button
                onClick={() => setHistoryTarget(row)}
                className="h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                History
              </button>
            </div>
          )
        },
      }),
    ],
    [],
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, manage supplies, and receive deliveries.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50">
            <Filter size={15} />
            Filters
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90"
          >
            <Plus size={15} />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Items</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white"><Package size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : total}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-red-600">Critical Stock</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-amber-600">Low Stock</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">In Stock</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Package size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total - lowStockCount}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'active', 'discontinued'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Status'}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <DataTable<InventoryRow>
        columns={columns}
        data={inventoryRows}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No inventory items found"
      />

      {adjustTarget && (
        <AdjustStockDialog
          itemId={adjustTarget.itemId}
          itemName={adjustTarget.itemName}
          unit={adjustTarget.unit}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {historyTarget && (
        <StockHistoryDialog
          itemId={historyTarget.itemId}
          itemName={historyTarget.itemName}
          unit={historyTarget.unit}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {showAddItem && <AddInventoryItemDialog onClose={() => setShowAddItem(false)} />}

      {batchesTarget && (
        <ViewBatchesDialog
          itemId={batchesTarget.itemId}
          itemName={batchesTarget.itemName}
          onClose={() => setBatchesTarget(null)}
        />
      )}

      {convertTarget && (
        <UnitConversionWidget
          quantity={convertTarget.currentStock}
          unitCode={convertTarget.unit}
          onClose={() => setConvertTarget(null)}
        />
      )}
    </div>
  )
}
