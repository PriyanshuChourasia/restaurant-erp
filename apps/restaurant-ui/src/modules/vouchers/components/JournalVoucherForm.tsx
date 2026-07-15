import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, BookText, Plus, Trash2 } from 'lucide-react'
import { createJournalVoucher, getLedgerAccountOptions } from '../api/vouchers.api'
import type { LedgerEntryDirection } from '../types/voucher.types'

interface JournalVoucherFormProps {
  onClose: () => void
}

interface LineRow {
  accountId: string
  type: LedgerEntryDirection
  amount: string
  description: string
}

const emptyRow = (): LineRow => ({ accountId: '', type: 'debit', amount: '', description: '' })

export function JournalVoucherForm({ onClose }: JournalVoucherFormProps) {
  const queryClient = useQueryClient()
  const [narration, setNarration] = useState('')
  const [rows, setRows] = useState<LineRow[]>([emptyRow(), { ...emptyRow(), type: 'credit' }])
  const [error, setError] = useState<string | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ['ledger-account-options'],
    queryFn: getLedgerAccountOptions,
  })

  const mutation = useMutation({
    mutationFn: createJournalVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-account-options'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create journal voucher')
    },
  })

  const updateRow = (index: number, patch: Partial<LineRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  const totalDebit = rows.filter((r) => r.type === 'debit').reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const totalCredit = rows.filter((r) => r.type === 'credit').reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const isBalanced = rows.length >= 2 && totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isBalanced) {
      setError('Debit and credit totals must be equal (and greater than zero)')
      return
    }
    if (rows.some((r) => !r.accountId || !Number(r.amount))) {
      setError('Every line needs an account and a positive amount')
      return
    }
    mutation.mutate({
      narration: narration || undefined,
      lines: rows.map((r) => ({
        accountId: r.accountId,
        type: r.type,
        amount: Number(r.amount),
        description: r.description || undefined,
      })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookText size={20} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Journal Voucher</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Narration</label>
            <input
              type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40"
              placeholder="What is this entry for?"
            />
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.accountId}
                  onChange={(e) => updateRow(i, { accountId: e.target.value })}
                  className="flex-1 h-9 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                >
                  <option value="">Account...</option>
                  {(accounts || []).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select
                  value={row.type}
                  onChange={(e) => updateRow(i, { type: e.target.value as LedgerEntryDirection })}
                  className="w-24 h-9 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
                <input
                  type="number" min="0.01" step="0.01" value={row.amount}
                  onChange={(e) => updateRow(i, { amount: e.target.value })}
                  className="w-28 h-9 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 2}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Plus size={14} /> Add line
          </button>

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
            <span className={isBalanced ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
              Debit ₹{totalDebit.toFixed(2)} · Credit ₹{totalCredit.toFixed(2)}
              {isBalanced ? ' — balanced' : ' — not balanced'}
            </span>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !isBalanced}
            className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Posting...' : 'Post Journal Voucher'}
          </button>
        </form>
      </div>
    </div>
  )
}
