import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { BookText, Plus, CreditCard, Wallet, X as XIcon } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { getVouchers, cancelVoucher } from '../api/vouchers.api'
import type { Voucher } from '../types/voucher.types'
import { PaymentVoucherForm } from '../components/PaymentVoucherForm'
import { ReceiptVoucherForm } from '../components/ReceiptVoucherForm'
import { JournalVoucherForm } from '../components/JournalVoucherForm'

const columnHelper = createColumnHelper<Voucher>()

const typeBadgeClass = (code: string) => {
  switch (code) {
    case 'payment': return 'bg-red-50 text-red-700'
    case 'receipt': return 'bg-emerald-50 text-emerald-700'
    default: return 'bg-blue-50 text-blue-700'
  }
}

const statusBadgeClass = (status: string) =>
  status === 'cancelled'
    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700'
    : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700'

export function VouchersPage() {
  const [page, setPage] = useState(1)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vouchers', page],
    queryFn: () => getVouchers({ page, limit: 20 }),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelVoucher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  })

  const vouchers = data?.data || []
  const total = data?.total || 0

  const columns = useMemo<ColumnDef<Voucher, any>[]>(
    () => [
      columnHelper.accessor('voucherNumber', {
        header: 'Voucher #',
        cell: (info) => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('voucherType', {
        header: 'Type',
        cell: (info) => {
          const vt = info.getValue()
          const code = vt?.code || info.row.original.voucherTypeId?.slice(0, 8) || ''
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeBadgeClass(code)}`}>
              {vt?.name || code}
            </span>
          )
        },
      }),
      columnHelper.accessor('paymentMode', {
        header: 'Mode',
        cell: (info) => <span className="uppercase text-xs">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('narration', {
        header: 'Narration',
        cell: (info) => <span className="text-gray-600">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => <span className="font-bold text-gray-900">₹{Number(info.getValue()).toFixed(2)}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <span className={statusBadgeClass(info.getValue())}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('voucherDate', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('en-IN'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const row = info.row.original
          if (row.status === 'cancelled') return null
          return (
            <button
              onClick={() => window.confirm(`Cancel voucher ${row.voucherNumber}? This posts a reversing journal entry.`) && cancelMutation.mutate(row.id)}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
            >
              <XIcon size={12} />
              Cancel
            </button>
          )
        },
      }),
    ],
    [cancelMutation],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <BookText size={24} className="text-primary" />
            Vouchers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Payment, receipt and journal vouchers posted to the ledger.</p>
        </div>
        <button
          onClick={() => setShowTypePicker(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} />
          New Voucher
        </button>
      </div>

      <DataTable<Voucher>
        columns={columns}
        data={vouchers}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No vouchers yet"
      />

      {showTypePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowTypePicker(false)}>
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">New Voucher</h3>
            <button
              onClick={() => { setActiveForm('payment'); setShowTypePicker(false) }}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <CreditCard size={18} className="text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Voucher</p>
                <p className="text-xs text-gray-400">Money going out (expenses, supplier payments)</p>
              </div>
            </button>
            <button
              onClick={() => { setActiveForm('receipt'); setShowTypePicker(false) }}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <Wallet size={18} className="text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Receipt Voucher</p>
                <p className="text-xs text-gray-400">Money coming in (customer payments)</p>
              </div>
            </button>
            <button
              onClick={() => { setActiveForm('journal'); setShowTypePicker(false) }}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <BookText size={18} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Journal Voucher</p>
                <p className="text-xs text-gray-400">Manual balanced entry across any accounts</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {activeForm === 'payment' && <PaymentVoucherForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'receipt' && <ReceiptVoucherForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'journal' && <JournalVoucherForm onClose={() => setActiveForm(null)} />}
    </div>
  )
}
