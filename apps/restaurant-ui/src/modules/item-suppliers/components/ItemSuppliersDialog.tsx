import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Building2, Star, Pencil, Trash2, Phone, Mail,
  Truck, IndianRupee, Package, ShieldCheck, Loader2,
  Check,
} from 'lucide-react'
import { apiClient } from '@/lib/axios-client'
import { getSuppliers } from '@/modules/suppliers/api/suppliers.api'
import { useItemSuppliers, useCreateItemSupplier, useUpdateItemSupplier, useDeleteItemSupplier, useSetPreferredSupplier } from '../hooks/useItemSupplierQueries'
import type { ItemSupplier } from '../api/item-suppliers.api'

interface ItemSuppliersDialogProps {
  itemId: string
  itemName: string
  onClose: () => void
}

const initialFormState = {
  supplierId: '',
  supplierSku: '',
  unitPrice: 0,
  unitId: '',
  leadTimeDays: 0,
  minOrderQty: 0,
  isPreferred: false,
  notes: '',
}

export function ItemSuppliersDialog({ itemId, itemName }: ItemSuppliersDialogProps) {
  const { data: links, isLoading } = useItemSuppliers(itemId)
  const createMutation = useCreateItemSupplier()
  const updateMutation = useUpdateItemSupplier()
  const deleteMutation = useDeleteItemSupplier()
  const setPreferredMutation = useSetPreferredSupplier()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(initialFormState)

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => getSuppliers({ limit: 100 }),
  })
  const suppliers = suppliersData?.data || []

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => apiClient.get('/units').then((r) => r.data),
  })
  const unitList = Array.isArray(units) ? units : []

  const resetForm = () => {
    setForm(initialFormState)
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (link: ItemSupplier) => {
    setForm({
      supplierId: link.supplierId,
      supplierSku: link.supplierSku || '',
      unitPrice: link.unitPrice,
      unitId: link.unitId || '',
      leadTimeDays: link.leadTimeDays,
      minOrderQty: link.minOrderQty,
      isPreferred: link.isPreferred,
      notes: link.notes || '',
    })
    setEditId(link.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) {
      await updateMutation.mutateAsync({
        id: editId,
        payload: {
          supplierSku: form.supplierSku || undefined,
          unitPrice: form.unitPrice,
          unitId: form.unitId || undefined,
          leadTimeDays: form.leadTimeDays,
          minOrderQty: form.minOrderQty,
          isPreferred: form.isPreferred,
          notes: form.notes || undefined,
        },
      })
    } else {
      await createMutation.mutateAsync({
        itemId,
        supplierId: form.supplierId,
        supplierSku: form.supplierSku || undefined,
        unitPrice: form.unitPrice,
        unitId: form.unitId || undefined,
        leadTimeDays: form.leadTimeDays,
        minOrderQty: form.minOrderQty,
        isPreferred: form.isPreferred,
        notes: form.notes || undefined,
      })
    }
    resetForm()
  }

  const handleDelete = async (id: string, supplierName: string) => {
    if (window.confirm(`Remove supplier "${supplierName}" from this item?`)) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSetPreferred = async (supplierId: string) => {
    await setPreferredMutation.mutateAsync({ itemId, supplierId })
  }

  const linkedSupplierIds = new Set((links || []).map((l) => l.supplierId))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> Supplier Pricing
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{itemName}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 transition-all"
          >
            <Plus size={14} /> Add Supplier
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">{editId ? 'Edit Supplier Link' : 'Link a Supplier'}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {!editId && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Supplier *</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  required
                  className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40 bg-white"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} disabled={linkedSupplierIds.has(s.id)}>
                      {s.name} {linkedSupplierIds.has(s.id) ? '(already linked)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Supplier SKU</label>
              <input
                value={form.supplierSku}
                onChange={(e) => setForm({ ...form, supplierSku: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="Their item code"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price (₹) *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                required
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price Unit</label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40 bg-white"
              >
                <option value="">Per unit...</option>
                {unitList.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lead Time (days)</label>
              <input
                type="number" min="0"
                value={form.leadTimeDays}
                onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Order Qty</label>
              <input
                type="number" step="0.001" min="0"
                value={form.minOrderQty}
                onChange={(e) => setForm({ ...form, minOrderQty: Number(e.target.value) })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPreferred}
                  onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-xs font-medium text-gray-600">Preferred supplier</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
              placeholder="Payment terms, delivery notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="h-7 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || (!editId && !form.supplierId)}
              className="h-7 px-3 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              {editId ? 'Update' : 'Add Link'}
            </button>
          </div>
        </form>
      )}

      {/* Supplier Links List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : !links || links.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Building2 size={40} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No suppliers linked</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Supplier" above to link vendors to this item.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const supplier = link.supplier
            if (!supplier) return null
            return (
              <div
                key={link.id}
                className={`rounded-xl border p-4 transition-all hover:shadow-sm ${
                  link.isPreferred
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-200 bg-white'
                } ${!link.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      link.isPreferred ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{supplier.name}</p>
                        {link.isPreferred && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                            <Star size={10} fill="currentColor" /> Preferred
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        {supplier.phone && (
                          <span className="flex items-center gap-1"><Phone size={11} /> {supplier.phone}</span>
                        )}
                        {supplier.email && (
                          <span className="flex items-center gap-1"><Mail size={11} /> {supplier.email}</span>
                        )}
                        {supplier.gstin && (
                          <span className="flex items-center gap-1"><ShieldCheck size={11} /> {supplier.gstin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {!link.isPreferred && (
                      <button
                        onClick={() => handleSetPreferred(link.supplierId)}
                        className="h-7 px-2 rounded-md text-xs text-amber-600 hover:bg-amber-50 transition-all"
                        title="Set as preferred"
                      >
                        <Star size={13} />
                      </button>
                    )}
                    <button onClick={() => startEdit(link)} className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(link.id, supplier.name)} className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Remove supplier">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Pricing details */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                  <span className="flex items-center gap-1 text-gray-700">
                    <IndianRupee size={12} className="text-gray-400" />
                    <span className="font-semibold">₹{link.unitPrice.toFixed(2)}</span>
                    {link.unit && <span className="text-gray-400">/{link.unit.symbol}</span>}
                  </span>
                  {link.leadTimeDays > 0 && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Truck size={12} /> {link.leadTimeDays}d lead time
                    </span>
                  )}
                  {link.minOrderQty > 0 && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Package size={12} /> Min: {link.minOrderQty}
                    </span>
                  )}
                  {link.supplierSku && (
                    <span className="text-gray-400 font-mono">SKU: {link.supplierSku}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
