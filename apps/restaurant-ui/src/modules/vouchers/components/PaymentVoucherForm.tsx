import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, CreditCard } from 'lucide-react'
import { createPaymentVoucher } from '../api/vouchers.api'
import { getLedgerAccountOptions } from '../api/vouchers.api'

interface PaymentVoucherFormProps {
  onClose: () => void
}

export function PaymentVoucherForm({ onClose }: PaymentVoucherFormProps) {
  const queryClient = useQueryClient()
  const [paymentMode, setPaymentMode] = useState('cash')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [narration, setNarration] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ['ledger-account-options'],
    queryFn: getLedgerAccountOptions,
  })

  const mutation = useMutation({
    mutationFn: createPaymentVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-account-options'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create payment voucher')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsedAmount = Number(amount)
    if (!accountId || !parsedAmount || parsedAmount <= 0) {
      setError('Select an account and enter a positive amount')
      return
    }
    mutation.mutate({
      paymentMode,
      amount: parsedAmount,
      debitLines: [{ accountId, amount: parsedAmount, description: narration || undefined }],
      narration: narration || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CreditCard size={20} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Payment Voucher</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Pay From</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Expense / Payable Account (Debit)</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40">
              <option value="">Select account...</option>
              {(accounts || []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Amount</label>
            <input
              type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Narration</label>
            <input
              type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40"
              placeholder="What is this payment for?"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Posting...' : 'Post Payment Voucher'}
          </button>
        </form>
      </div>
    </div>
  )
}
