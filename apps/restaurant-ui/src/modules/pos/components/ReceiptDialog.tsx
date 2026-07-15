import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Printer, X, Loader2, Receipt, Check } from 'lucide-react'
import { getInvoice, clearInvoiceTables } from '../api/pos.api'
import { useOrganization } from '@/modules/settings/hooks/useOrganizationQueries'

interface ReceiptInvoiceItem {
  id: string
  itemName: string
  hsnCode: string
  quantity: number
  unitPrice: number
  gstRate: number
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
}

interface ReceiptInvoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  customerName: string | null
  customerPhone: string | null
  customerGstin: string | null
  tableIds: string[] | null
  paymentMethod: string
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  taxTotal: number
  discount: number
  roundOff: number
  grandTotal: number
  items: ReceiptInvoiceItem[]
}

interface ReceiptDialogProps {
  invoiceId: string
  onClose: () => void
}

export function ReceiptDialog({ invoiceId, onClose }: ReceiptDialogProps) {
  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId) as Promise<ReceiptInvoice>,
    enabled: !!invoiceId,
  })
  const { data: org } = useOrganization()
  const [tablesCleared, setTablesCleared] = useState(false)
  const clearTablesMutation = useMutation({
    mutationFn: () => clearInvoiceTables(invoiceId),
    onSuccess: () => setTablesCleared(true),
  })

  return createPortal(
    <div className="receipt-dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="receipt-dialog-card relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isLoading ? 'Loading...' : invoice?.invoiceNumber || 'Invoice'}
              </h3>
              <p className="text-xs text-gray-500">Invoice generated</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {invoice && (
              <button
                onClick={() => window.print()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                title="Print receipt"
              >
                <Printer size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : isError || !invoice ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Receipt size={36} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">Could not load invoice</p>
            <button onClick={onClose} className="mt-3 text-xs text-primary hover:underline">Close</button>
          </div>
        ) : (
          <div id="receipt-print-area" className="p-6 space-y-4 font-mono text-sm text-gray-900">
            {/* Restaurant header */}
            <div className="text-center space-y-0.5">
              <p className="text-base font-bold">{org?.restaurantName || 'Restaurant'}</p>
              {org?.address && <p className="text-xs text-gray-500">{org.address}{org?.city ? `, ${org.city}` : ''}</p>}
              {org?.phone && <p className="text-xs text-gray-500">Ph: {org.phone}</p>}
              {org?.gstin && <p className="text-xs text-gray-500">GSTIN: {org.gstin}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Invoice meta */}
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between"><span>Invoice #</span><span className="font-semibold">{invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span>Date</span><span>{new Date(invoice.invoiceDate).toLocaleString('en-IN')}</span></div>
              {invoice.customerName && <div className="flex justify-between"><span>Customer</span><span>{invoice.customerName}</span></div>}
              {invoice.tableIds && invoice.tableIds.length > 0 && (
                <div className="flex justify-between"><span>Table(s)</span><span>{invoice.tableIds.length}</span></div>
              )}
              <div className="flex justify-between"><span>Payment</span><span className="uppercase">{invoice.paymentMethod}</span></div>
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Items */}
            <div className="space-y-1.5 text-xs">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="flex-1">{item.itemName} x{Number(item.quantity)}</span>
                  <span>₹{Number(item.totalAmount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(invoice.subtotal).toFixed(2)}</span></div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-red-600"><span>Discount</span><span>-₹{Number(invoice.discount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span>CGST</span><span>₹{Number(invoice.cgstTotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST</span><span>₹{Number(invoice.sgstTotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Round Off</span><span>₹{Number(invoice.roundOff).toFixed(2)}</span></div>
            </div>

            <div className="border-t border-dashed border-gray-300" />

            <div className="flex justify-between text-base font-bold">
              <span>Grand Total</span>
              <span>₹{Number(invoice.grandTotal).toFixed(2)}</span>
            </div>

            {org?.invoiceFooter && (
              <>
                <div className="border-t border-dashed border-gray-300" />
                <p className="text-center text-xs text-gray-500">{org.invoiceFooter}</p>
              </>
            )}

            {invoice.tableIds && invoice.tableIds.length > 0 && (
              <div className="print:hidden pt-1">
                <button
                  onClick={() => clearTablesMutation.mutate()}
                  disabled={tablesCleared || clearTablesMutation.isPending}
                  className="flex w-full h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {tablesCleared ? <Check size={14} className="text-emerald-600" /> : null}
                  {tablesCleared ? 'Tables cleared' : clearTablesMutation.isPending ? 'Clearing...' : 'Clear tables'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
