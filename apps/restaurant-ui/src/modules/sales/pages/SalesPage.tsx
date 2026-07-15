import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Search, Receipt, IndianRupee, Eye, Ban, FileMinus } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'
import { DataTable } from '@/components/ui/data-table'
import { ReceiptDialog } from '@/modules/pos/components/ReceiptDialog'
import { CreditNoteDialog } from '../dialogs/CreditNoteDialog'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string | null
  tableNumbers: string[] | null
  items: unknown[]
  subtotal: number
  taxTotal: number
  grandTotal: number
  paymentMethod: string
  status: string
  createdAt: string
}

const columnHelper = createColumnHelper<Invoice>()

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'
    case 'cancelled': return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700'
    default: return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700'
  }
}

export function SalesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null)
  const [creditNoteInvoiceId, setCreditNoteInvoiceId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => apiClient.get('/sales', { params: { page, limit: 20, search: search || undefined } }).then(r => r.data),
  })

  const { data: daily } = useQuery({
    queryKey: ['sales-daily'],
    queryFn: () => apiClient.get('/sales/daily').then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/sales/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-daily'] })
    },
  })

  const invoices: Invoice[] = data?.data || []
  const total = data?.total || 0

  const columns = useMemo<ColumnDef<Invoice, any>[]>(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: 'Invoice #',
        cell: (info) => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('customerName', {
        header: 'Customer',
        cell: (info) => info.getValue() || 'Walk-in',
      }),
      columnHelper.accessor('tableNumbers', {
        header: 'Table',
        cell: (info) => info.getValue()?.join(', ') || '-',
      }),
      columnHelper.accessor('items', {
        header: 'Items',
        cell: (info) => (info.getValue()?.length || 0).toString(),
      }),
      columnHelper.accessor('subtotal', {
        header: 'Subtotal',
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor('taxTotal', {
        header: 'GST',
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor('grandTotal', {
        header: 'Total',
        cell: (info) => <span className="font-bold text-gray-900">₹{Number(info.getValue()).toFixed(2)}</span>,
      }),
      columnHelper.accessor('paymentMethod', {
        header: 'Payment',
        cell: (info) => <span className="uppercase text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={statusBadgeClass(info.getValue())}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('en-IN'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const row = info.row.original
          const canCancel = row.status !== 'cancelled' && row.status !== 'completed'
          const canCreditNote = row.status !== 'cancelled'
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewInvoiceId(row.id)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                <Eye size={12} />
                View
              </button>
              {canCreditNote && (
                <button
                  onClick={() => setCreditNoteInvoiceId(row.id)}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                >
                  <FileMinus size={12} />
                  Credit Note
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => window.confirm(`Cancel invoice ${row.invoiceNumber}? This restores stock, releases tables, and reverses the posted accounting.`) && cancelMutation.mutate(row.id)}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                >
                  <Ban size={12} />
                  Cancel
                </button>
              )}
            </div>
          )
        },
      }),
    ],
    [cancelMutation],
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Receipt size={24} className="text-primary" />
            Sales & Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">View all sales transactions with GST breakdown.</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-52 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Daily Summary */}
      {daily && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Today's Sales</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <IndianRupee size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{daily.totalSales?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-gray-400 mt-1">{daily.orderCount || 0} orders</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Today's Tax (GST)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
                <IndianRupee size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{daily.totalTax?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Avg Order Value</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Receipt size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{daily.orderCount > 0 ? (daily.totalSales / daily.orderCount).toFixed(2) : '0.00'}</p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <DataTable<Invoice>
        columns={columns}
        data={invoices}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No sales yet"
      />

      {viewInvoiceId && (
        <ReceiptDialog
          invoiceId={viewInvoiceId}
          onClose={() => setViewInvoiceId(null)}
        />
      )}

      {creditNoteInvoiceId && (
        <CreditNoteDialog
          invoiceId={creditNoteInvoiceId}
          onClose={() => setCreditNoteInvoiceId(null)}
        />
      )}
    </div>
  )
}
