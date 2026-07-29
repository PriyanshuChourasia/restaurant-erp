import { useState, useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Wallet, Trash2, Edit3 } from 'lucide-react'
import { useCostCentres, useCreateCostCentre, useUpdateCostCentre, useDeleteCostCentre } from '../hooks/useCostCentreQueries'
import { DataTable } from '@/components/ui/data-table'

const emptyForm = {
  name: '',
  code: '',
  description: '',
  isActive: true,
}

export function CostCentresPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useCostCentres({ page, limit: 20, search: search || undefined })
  const createMutation = useCreateCostCentre()
  const updateMutation = useUpdateCostCentre()
  const deleteMutation = useDeleteCostCentre()

  const costCentres = data?.data || []
  const total = data?.total || 0

  const activeCount = costCentres.filter((c: any) => c.isActive !== false && !c.deletedAt).length

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete cost centre "${name}"?`)) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const startEdit = (costCentre: any) => {
    setForm({
      name: costCentre.name || '',
      code: costCentre.code || '',
      description: costCentre.description || '',
      isActive: costCentre.isActive !== false,
    })
    setEditingId(costCentre.id)
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
                <Wallet size={15} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{info.getValue()}</p>
                {row.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{row.description}</p>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info: any) => <span className="font-mono text-xs text-gray-600">{info.getValue()}</span>,
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info: any) =>
          info.getValue() ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
          ),
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
      code: form.code,
      description: form.description || undefined,
      isActive: form.isActive,
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
        code: form.code,
        description: form.description || null,
        isActive: form.isActive,
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cost Centres</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cost centres used to allocate and tag expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cost centres..."
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
            {showForm ? 'Cancel' : 'Add Cost Centre'}
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
            {editingId ? 'Edit Cost Centre' : 'Add New Cost Centre'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="e.g. Kitchen"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="e.g. KIT"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="cost-centre-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
              />
              <label htmlFor="cost-centre-active" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm outline-none focus:border-primary/40"
                placeholder="Optional description"
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
              disabled={createMutation.isPending || updateMutation.isPending || !form.name || !form.code}
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
            <span className="text-sm font-medium text-gray-500">Total Cost Centres</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white"><Wallet size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white"><Wallet size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">On This Page</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white"><Wallet size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{costCentres.length}</p>
        </div>
      </div>

      {/* Cost Centres Table */}
      <DataTable<any>
        columns={columns}
        data={costCentres}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No cost centres found"
      />
    </div>
  )
}
