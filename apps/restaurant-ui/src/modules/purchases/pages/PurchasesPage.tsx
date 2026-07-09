import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Search, ClipboardList, Plus, Eye } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'
import { DataTable } from '@/components/ui/data-table'

interface PurchaseOrder {
  id: string
  purchaseNumber: string
  supplier: { name: string } | null
  items: unknown[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: string
  purchaseDate: string
}

const columnHelper = createColumnHelper<PurchaseOrder>()

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'received': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'
    case 'cancelled': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700'
    default: return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700'
  }
}

export function PurchasesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search, statusFilter],
    queryFn: () => apiClient.get('/purchases', { params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined } }).then(r => r.data),
  })

  const purchases: PurchaseOrder[] = data?.data || []
  const total = data?.total || 0

  const columns = useMemo<ColumnDef<PurchaseOrder, any>[]>(
    () => [
      columnHelper.accessor('purchaseNumber', {
        header: 'PO #',
        cell: (info) => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('supplier', {
        header: 'Supplier',
        cell: (info) => info.getValue()?.name || '-',
      }),
      columnHelper.accessor('items', {
        header: 'Items',
        cell: (info) => (info.getValue()?.length || 0).toString(),
      }),
      columnHelper.accessor('subtotal', {
        header: 'Subtotal',
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor('taxAmount', {
        header: 'Tax',
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Total',
        cell: (info) => <span className="font-bold text-gray-900">₹{Number(info.getValue()).toFixed(2)}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={statusBadgeClass(info.getValue())}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('purchaseDate', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('en-IN'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: () => (
          <button className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all">
            <Eye size={12} />
            View
          </button>
        ),
      }),
    ],
    [],
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <ClipboardList size={24} className="text-primary" />
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track purchases from suppliers.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchases..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90">
            <Plus size={15} />
            New Purchase
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'ordered', 'received', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Purchases Table */}
      <DataTable<PurchaseOrder>
        columns={columns}
        data={purchases}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No purchases yet"
      />
    </div>
  )
}
