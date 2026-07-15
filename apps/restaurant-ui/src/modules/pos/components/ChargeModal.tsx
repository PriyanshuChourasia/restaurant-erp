import { useState } from 'react'
import { CreditCard, Smartphone, Banknote, Globe, Clock, X } from 'lucide-react'

interface CartItem {
  id: string
  itemId: string
  name: string
  hsnCode: string
  price: number
  gstRate: number
  quantity: number
  unitCode: string
}

interface ChargeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (paymentMethod: string) => void
  cart: CartItem[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  roundOff: number
  finalTotal: number
  isPending: boolean
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'online', label: 'Online', icon: Globe },
  { value: 'credit', label: 'Credit', icon: Clock },
]

export function ChargeModal({
  open,
  onClose,
  onConfirm,
  cart,
  subtotal,
  cgstTotal,
  sgstTotal,
  roundOff,
  finalTotal,
  isPending,
}: ChargeModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Summary</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items list */}
        <div className="max-h-48 overflow-auto px-6 py-3 space-y-2">
          {cart.map((item) => (
            <div key={item.itemId} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate mr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="text-gray-900 font-medium shrink-0">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 px-6 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Taxable Value</span>
            <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">CGST</span>
            <span className="text-gray-900">₹{cgstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">SGST</span>
            <span className="text-gray-900">₹{sgstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Round Off</span>
            <span className="text-gray-900">{roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-base font-bold text-gray-900">Grand Total</span>
            <span className="text-base font-bold text-primary">
              ₹{finalTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="border-t border-gray-200 px-6 py-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Select Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-all ${
                  paymentMethod === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
          {paymentMethod === 'credit' && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              No payment collected now — recorded as Accounts Receivable until settled.
            </p>
          )}
        </div>

        {/* Confirm button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            disabled={isPending}
            onClick={() => onConfirm(paymentMethod)}
            className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CreditCard size={18} />
                Confirm Payment ₹{finalTotal.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
