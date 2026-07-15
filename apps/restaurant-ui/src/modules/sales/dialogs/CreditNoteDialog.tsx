import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Receipt, Plus, Trash2 } from 'lucide-react'
import { getInvoice } from '@/modules/pos/api/pos.api'
import { getItems } from '@/modules/items/api/items.api'
import { createCreditNote } from '../api/sales.api'

interface CreditNoteDialogProps {
  invoiceId: string
  onClose: () => void
}

interface CreditLineState {
  invoiceItemId: string
  itemName: string
  originalQuantity: number
  creditQuantity: string
  restoreStock: boolean
}

interface ReplacementLine {
  itemId: string
  itemName: string
  quantity: number
}

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'online', 'credit']

export function CreditNoteDialog({ invoiceId, onClose }: CreditNoteDialogProps) {
  const queryClient = useQueryClient()
  const [lines, setLines] = useState<CreditLineState[] | null>(null)
  const [reason, setReason] = useState('')
  const [replacementItems, setReplacementItems] = useState<ReplacementLine[]>([])
  const [pickerItemId, setPickerItemId] = useState('')
  const [pickerQty, setPickerQty] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ creditNoteNumber: string; grandTotal: number; replacementInvoiceNumber?: string } | null>(null)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  })

  useEffect(() => {
    if (invoice && !lines) {
      setLines(
        (invoice as any).items.map((item: any) => ({
          invoiceItemId: item.id,
          itemName: item.itemName,
          originalQuantity: Number(item.quantity),
          creditQuantity: '',
          restoreStock: true,
        })),
      )
    }
  }, [invoice, lines])

  const { data: itemsData } = useQuery({
    queryKey: ['items-credit-note-picker'],
    queryFn: () => getItems({ limit: 200 }),
  })

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createCreditNote>[1]) => createCreditNote(invoiceId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-daily'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-account-options'] })
      setResult({
        creditNoteNumber: data.creditNote.creditNoteNumber,
        grandTotal: Number(data.creditNote.grandTotal),
        replacementInvoiceNumber: data.replacementInvoice?.invoiceNumber,
      })
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create credit note')
    },
  })

  const addReplacementItem = () => {
    const item = (itemsData?.items || []).find((i: any) => i.id === pickerItemId)
    const qty = Number(pickerQty)
    if (!item || !qty || qty <= 0) return
    setReplacementItems((prev) => [...prev, { itemId: item.id, itemName: item.name, quantity: qty }])
    setPickerItemId('')
    setPickerQty('1')
  }

  const removeReplacementItem = (index: number) =>
    setReplacementItems((prev) => prev.filter((_, i) => i !== index))

  const activeLines = useMemo(
    () => (lines || []).filter((l) => Number(l.creditQuantity) > 0),
    [lines],
  )

  const handleSubmit = () => {
    setError(null)
    if (activeLines.length === 0) {
      setError('Enter a quantity to credit for at least one item')
      return
    }
    mutation.mutate({
      items: activeLines.map((l) => ({
        invoiceItemId: l.invoiceItemId,
        quantity: Number(l.creditQuantity),
        restoreStock: l.restoreStock,
      })),
      reason: reason || undefined,
      replacementItems: replacementItems.length > 0
        ? replacementItems.map((r) => ({ itemId: r.itemId, quantity: r.quantity }))
        : undefined,
      paymentMethod: replacementItems.length > 0 ? paymentMethod : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Receipt size={20} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Credit Note {invoice ? `— ${(invoice as any).invoiceNumber}` : ''}
            </h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {isLoading || !lines ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading invoice...</div>
        ) : result ? (
          <div className="p-6 space-y-3 text-center">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4">
              <p className="font-semibold">{result.creditNoteNumber} posted</p>
              <p>₹{result.grandTotal.toFixed(2)} credited</p>
              {result.replacementInvoiceNumber && (
                <p className="mt-1">Replacement invoice: {result.replacementInvoiceNumber}</p>
              )}
            </div>
            <button onClick={onClose} className="w-full h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Items to credit</p>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={line.invoiceItemId} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 font-medium">{line.itemName}</span>
                      <span className="text-xs text-gray-400">of {line.originalQuantity} sold</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number" min="0" max={line.originalQuantity} step="0.01"
                        value={line.creditQuantity}
                        onChange={(e) => setLines((prev) => prev!.map((l, j) => (j === i ? { ...l, creditQuantity: e.target.value } : l)))}
                        placeholder="0"
                        className="w-24 h-8 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox" checked={line.restoreStock}
                          onChange={(e) => setLines((prev) => prev!.map((l, j) => (j === i ? { ...l, restoreStock: e.target.checked } : l)))}
                        />
                        Restore stock
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Reason</label>
              <input
                type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-primary/40"
                placeholder="Why is this being credited?"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Replacement item(s) (optional)</p>
              {replacementItems.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {replacementItems.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                      <span>{r.itemName} × {r.quantity}</span>
                      <button onClick={() => removeReplacementItem(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <select
                  value={pickerItemId} onChange={(e) => setPickerItemId(e.target.value)}
                  className="flex-1 h-8 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                >
                  <option value="">Select item...</option>
                  {(itemsData?.items || []).map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <input
                  type="number" min="1" step="1" value={pickerQty}
                  onChange={(e) => setPickerQty(e.target.value)}
                  className="w-16 h-8 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                />
                <button onClick={addReplacementItem} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <Plus size={14} />
                </button>
              </div>
              {replacementItems.length > 0 && (
                <div className="mt-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Payment for replacement</label>
                  <select
                    value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-8 rounded-lg border border-gray-300 px-2 text-xs outline-none focus:border-primary/40"
                  >
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Posting...' : 'Post Credit Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
