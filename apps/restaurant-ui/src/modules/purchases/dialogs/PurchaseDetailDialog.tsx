import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios-client'
import { Package, ClipboardList, Loader2, X, IndianRupee } from 'lucide-react'
import { FormattedQuantity } from '@/components/ui/FormattedQuantity'

interface PurchaseItemDetail {
  id: string
  itemId: string
  quantity: number
  unitPrice: number
  gstRate: number
  totalPrice: number
  item?: { id: string; name: string; sku: string; unit?: { code: string; name: string } }
}

interface PurchaseDetail {
  id: string
  purchaseNumber: string
  status: string
  purchaseDate: string
  supplier: { name: string } | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  discount: number
  notes: string | null
  items: PurchaseItemDetail[]
}

interface PurchaseDetailDialogProps {
  purchaseId: string
  onClose: () => void
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'received': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-blue-100 text-blue-700 border-blue-200'
  }
}

export function PurchaseDetailDialog({ purchaseId, onClose }: PurchaseDetailDialogProps) {
  const { data: purchase, isLoading, isError } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => apiClient.get<PurchaseDetail>(`/purchases/${purchaseId}`).then(r => r.data),
    enabled: !!purchaseId,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isLoading ? 'Loading...' : purchase?.purchaseNumber || 'Purchase Order'}
              </h3>
              <p className="text-xs text-gray-500">Purchase order details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : isError || !purchase ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Package size={36} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">Could not load purchase details</p>
            <button onClick={onClose} className="mt-3 text-xs text-primary hover:underline">Close</button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Supplier</p>
                <p className="text-sm font-semibold text-gray-900">{purchase.supplier?.name || '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusBadgeClass(purchase.status)}`}>
                  {purchase.status}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Items</p>
                <p className="text-sm font-semibold text-gray-900">{purchase.items.length} line items</p>
              </div>
            </div>

            {/* Notes */}
            {purchase.notes && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                📝 {purchase.notes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                Line Items
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">GST</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((line) => {
                      const unitCode = line.item?.unit?.code || ''
                      return (
                        <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{line.item?.name || 'Unknown'}</span>
                            {line.item?.sku && <span className="ml-2 text-xs text-gray-400 font-mono">{line.item.sku}</span>}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            <FormattedQuantity quantity={line.quantity} unit={unitCode} variant="full" />
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            <span className="flex items-center justify-end gap-0.5">
                              <IndianRupee size={10} className="text-gray-400" />
                              {Number(line.unitPrice).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-gray-500">{line.gstRate}%</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            <span className="flex items-center justify-end gap-0.5">
                              <IndianRupee size={10} className="text-gray-400" />
                              {Number(line.totalPrice).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">₹{Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-red-600">-₹{Number(purchase.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (GST)</span>
                <span className="text-gray-900">₹{Number(purchase.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-primary">₹{Number(purchase.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
