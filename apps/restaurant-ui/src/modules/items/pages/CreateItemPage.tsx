import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { ArrowLeft, Save, Tag, IndianRupee, AlertTriangle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios-client'
import { createItem } from '../api/items.api'
import { getCategories } from '@/modules/category/api/category.api'

const GST_RATES = [
  { value: 0, label: 'GST 0% (Nil)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' },
]

const ITEM_TYPES = [
  { value: 'goods', label: 'Goods (Physical Product)' },
  { value: 'service', label: 'Service' },
]

const PRODUCT_TYPES = [
  { value: 'raw', label: 'Raw Material' },
  { value: 'finished', label: 'Finished Good' },
  { value: 'semi_finished', label: 'Semi Finished' },
  { value: 'trading', label: 'Trading Item' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'service', label: 'Service' },
]

export function CreateItemPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: cats } = useQuery({ queryKey: ['categories-tree'], queryFn: () => getCategories({ limit: 100 }) })
  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => apiClient.get('/units').then(r => r.data),
  })

  const unitList = Array.isArray(units) ? units : []

  const [form, setForm] = useState({
    name: '', sku: '', hsnCode: '', price: 0, costPrice: 0,
    gstRate: 18, itemType: 'goods', isTaxable: true, cessPercent: 0, reverseCharge: false,
    unitId: '', purchaseUnitId: '', productType: 'finished', isVeg: true, isActive: true,
    categoryId: '', description: '',
  })

  const mutation = useMutation({
    mutationFn: () => createItem({
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      unitId: form.unitId,
      purchaseUnitId: form.purchaseUnitId || undefined,
      categoryId: form.categoryId || undefined,
      itemType: (form.itemType || 'goods') as 'goods' | 'service',
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['items'] }); navigate({ to: '/items' }) },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/items" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Tag size={22} className="text-primary" /> New Item</h1>
          <p className="text-sm text-gray-500">Add a new menu item with GST details</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code *</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} required placeholder="e.g. 210690" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
            <input type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
            <input type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
          </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate *</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}>
                {GST_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>
                {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
                <option value="">Select a unit...</option>
                {unitList.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })}>
              {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {cats?.items?.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Vegetarian</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* Taxability Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <IndianRupee size={14} className="text-gray-400" />
            Taxability Settings
          </h4>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isTaxable}
                onChange={(e) => setForm({ ...form, isTaxable: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Taxable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.reverseCharge}
                onChange={(e) => setForm({ ...form, reverseCharge: e.target.checked })}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-gray-700">Reverse Charge</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 whitespace-nowrap">Cess (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                value={form.cessPercent}
                onChange={(e) => setForm({ ...form, cessPercent: Number(e.target.value) })}
              />
            </div>
          </div>
          {!form.isTaxable && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              This item will be treated as GST-exempt. No tax will be applied.
            </p>
          )}
        </div>

        {/* GST Preview */}
        {form.price > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">GST Breakdown Preview</h4>
            <div className="text-sm space-y-1 text-gray-600">
              <p>Taxable Value: ₹{(form.price / (1 + form.gstRate / 100)).toFixed(2)}</p>
              <p>CGST ({form.gstRate / 2}%): ₹{((form.price / (1 + form.gstRate / 100)) * (form.gstRate / 2) / 100).toFixed(2)}</p>
              <p>SGST ({form.gstRate / 2}%): ₹{((form.price / (1 + form.gstRate / 100)) * (form.gstRate / 2) / 100).toFixed(2)}</p>
              <p className="font-semibold text-gray-900">Total (incl. GST): ₹{form.price.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex items-center gap-2">
            <Save size={16} /> {mutation.isPending ? 'Saving...' : 'Save Item'}
          </button>
          <Link to="/items" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
