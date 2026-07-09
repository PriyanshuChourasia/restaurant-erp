import { useState, useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Building2, Phone, Mail, MapPin, Trash2, Edit3 } from 'lucide-react'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSupplierQueries'
import { DataTable } from '@/components/ui/data-table'

const emptyForm = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  gstin: '',
  paymentTerms: '',
}

export function SuppliersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useSuppliers({ page, limit: 20, search: search || undefined })
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

  const suppliers = data?.data || []
  const total = data?.total || 0

  const activeCount = suppliers.filter((s: any) => s.isActive !== false && !s.deletedAt).length

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const startEdit = (supplier: any) => {
    setForm({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      gstin: supplier.gstin || '',
      paymentTerms: supplier.paymentTerms || '',
    })
    setEditingId(supplier.id)
    setShowForm(true)
  }

  const columnHelper = createColumnHelper<any>()

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info: any) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <Building2 size={15} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{info.getValue()}</p>
                {row.address && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {row.address}
                  </p>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('contactPerson', {
        header: 'Contact',
        cell: (info: any) => {
          const row = info.row.original
          return info.getValue() ? (
            <div className="flex items-center gap-1 text-gray-700">
              <Phone size={12} className="text-gray-400 shrink-0" />
              <span>{row.phone || info.getValue()}</span>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )
        },
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info: any) => {
          return info.getValue() ? (
            <div className="flex items-center gap-1 text-gray-700">
              <Mail size={12} className="text-gray-400 shrink-0" />
              <span>{info.getValue()}</span>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )
        },
      }),
      columnHelper.accessor('gstin', {
        header: 'GSTIN',
        cell: (info: any) => info.getValue() ? <span className="font-mono text-xs text-gray-600">{info.getValue()}</span> : <span className="text-gray-400">—</span>,
      }),
      columnHelper.accessor('paymentTerms', {
        header: 'Terms',
        cell: (info: any) => info.getValue() || '—',
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info: any) => {
          const row = info.row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => startEdit(row)}
                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => handleDelete(row.id, row.name)}
                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        },
      }),
    ],
    [startEdit, handleDelete],
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync({
      name: form.name,
      contactPerson: form.contactPerson || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      gstin: form.gstin || undefined,
      paymentTerms: form.paymentTerms || undefined,
    })
    resetForm()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    await updateMutation.mutateAsync({
      id: editingId,
      payload: {
        name: form.name,
        contactPerson: form.contactPerson || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        gstin: form.gstin || null,
        paymentTerms: form.paymentTerms || null,
      },
    })
    resetForm()
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your suppliers and vendor relationships.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90"
          >
            <Plus size={15} />
            {showForm ? 'Cancel' : 'Add Supplier'}
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">
            {editingId ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="Contact name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">GSTIN</label>
              <input
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="GSTIN number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Terms</label>
              <input
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="e.g. Net 30"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="Full address"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="h-8 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || !form.name}
              className="h-8 px-4 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Suppliers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white"><Building2 size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white"><Building2 size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">On This Page</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white"><Building2 size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
        </div>
      </div>

      {/* Suppliers Table */}
      <DataTable<any>
        columns={columns}
        data={suppliers}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No suppliers found"
      />
    </div>
  )
}
