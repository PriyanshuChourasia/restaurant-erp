import { useState, useMemo, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, UtensilsCrossed, Tag, IndianRupee, Pencil, Trash2, Undo2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { getItems, deleteItem, restoreItem } from '../api/items.api'
import { DataTable } from '@/components/ui/data-table'

const GST_RATES = ['all', '0', '5', '12', '18', '28']

interface ItemRow {
  id: string
  name: string
  sku: string
  hsnCode: string
  price: number
  gstRate: number
  categoryName: string | null
  isVeg: boolean
  isActive: boolean
}

const columnHelper = createColumnHelper<ItemRow>()

export function ItemListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gstFilter, setGstFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, search],
    queryFn: () => getItems({ page, limit: 20, search: search || undefined }),
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })

  const handleDelete = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
    setDeleteTarget(null)
  }, [deleteMutation])

  const handleRestore = useCallback(async (id: string) => {
    await restoreMutation.mutateAsync(id)
    setRestoreTarget(null)
  }, [restoreMutation])

  const items = data?.items || []
  const total = data?.total || 0

  const filteredItems: ItemRow[] = useMemo(
    () =>
      items
        .filter((item) => gstFilter === 'all' || String(item.gstRate) === gstFilter)
        .map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          hsnCode: item.hsnCode,
          price: item.price,
          gstRate: item.gstRate,
          categoryName: item.categoryName,
          isVeg: item.isVeg,
          isActive: item.isActive,
        })),
    [items, gstFilter],
  )

  const columns = useMemo<ColumnDef<ItemRow, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed size={17} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{info.getValue()}</p>
                <p className="text-xs text-gray-400">SKU: {row.sku}</p>
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('isVeg', {
        header: 'Type',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            info.getValue() ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {info.getValue() ? 'Veg' : 'Non-Veg'}
          </span>
        ),
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <IndianRupee size={13} className="text-gray-400" />
            <span className="font-bold text-gray-900">₹{info.getValue().toFixed(2)}</span>
          </div>
        ),
      }),
      columnHelper.accessor('hsnCode', {
        header: 'HSN',
        cell: (info) => <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('gstRate', {
        header: 'GST',
        cell: (info) => <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">GST {info.getValue()}%</span>,
      }),
      columnHelper.accessor('categoryName', {
        header: 'Category',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => !info.getValue() ? <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Inactive</span> : null,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-1">
              <Link
                to="/items/$id"
                params={{ id: row.id }}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                title="Edit item"
              >
                <Pencil size={14} />
              </Link>
              <button
                onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete item"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setRestoreTarget({ id: row.id, name: row.name })}
                className="p-1.5 rounded-md text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                title="Restore item"
              >
                <Undo2 size={14} />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Tag size={24} className="text-primary" />
            Items & Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage menu items with GST rates, HSN codes, and pricing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <Link to="/items/create" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90">
            <Plus size={15} />
            Add Item
          </Link>
        </div>
      </div>

      {/* GST Rate Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {GST_RATES.map((rate) => (
          <button
            key={rate}
            onClick={() => setGstFilter(rate)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              gstFilter === rate ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rate === 'all' ? 'All Rates' : `GST ${rate}%`}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <DataTable<ItemRow>
        columns={columns}
        data={filteredItems}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={search ? 'No items match your search.' : 'No items found. Add your first item to get started.'}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-50 mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
                <p className="text-sm text-gray-500">This action can be undone by restoring.</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-700">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 size={14} />
                )}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRestoreTarget(null)} />
          <div className="relative z-50 mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Undo2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Restore Item</h3>
                <p className="text-sm text-gray-500">Make this item active again.</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-700">
              Restore <strong>"{restoreTarget.name}"</strong> to active items?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRestoreTarget(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleRestore(restoreTarget.id)}
                disabled={restoreMutation.isPending}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {restoreMutation.isPending ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Undo2 size={14} />
                )}
                {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
