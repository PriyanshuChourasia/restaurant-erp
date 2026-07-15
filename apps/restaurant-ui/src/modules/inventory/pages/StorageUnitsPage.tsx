import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Edit, Warehouse, ToggleLeft, ToggleRight, Star, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'
import type { StorageUnit } from '../types/inventory.types'

const API_URL = '/storage-units'

async function getStorageUnits(includeInactive = false): Promise<StorageUnit[]> {
  const { data } = await apiClient.get<StorageUnit[]>(API_URL, {
    params: includeInactive ? { includeInactive: 'true' } : {},
  })
  return data
}

async function createStorageUnit(payload: {
  name: string
  code: string
  type: string
}): Promise<StorageUnit> {
  const { data } = await apiClient.post<StorageUnit>(API_URL, payload)
  return data
}

async function updateStorageUnit(id: string, payload: Record<string, unknown>): Promise<StorageUnit> {
  const { data } = await apiClient.patch<StorageUnit>(`${API_URL}/${id}`, payload)
  return data
}

async function setDefaultStorageUnit(id: string): Promise<StorageUnit> {
  const { data } = await apiClient.patch<StorageUnit>(`${API_URL}/${id}/set-default`, {})
  return data
}

async function deleteStorageUnit(id: string): Promise<void> {
  await apiClient.delete(`${API_URL}/${id}`)
}

const STORAGE_UNIT_TYPES = [
  { value: 'store', label: 'Store', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'kitchen', label: 'Kitchen', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'bar', label: 'Bar', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'cold_storage', label: 'Cold Storage', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-600 border-gray-200' },
]

export function StorageUnitsPage() {
  const queryClient = useQueryClient()
  const { data: units, isLoading } = useQuery({
    queryKey: ['storage-units'],
    queryFn: () => getStorageUnits(true),
  })

  const [showForm, setShowForm] = useState(false)
  const [editUnit, setEditUnit] = useState<StorageUnit | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState('store')

  const createMutation = useMutation({
    mutationFn: createStorageUnit,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['storage-units'] }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateStorageUnit(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['storage-units'] }); resetForm() },
  })

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultStorageUnit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-units'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStorageUnit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-units'] }),
  })

  const sorted = useMemo(() => {
    if (!units) return []
    return [...units].sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })
  }, [units])

  const resetForm = () => {
    setFormName(''); setFormCode(''); setFormType('store')
    setShowForm(false); setEditUnit(null)
  }

  const startEdit = (unit: StorageUnit) => {
    setEditUnit(unit); setFormName(unit.name); setFormCode(unit.code); setFormType(unit.type); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: formName, code: formCode, type: formType }
    if (editUnit) updateMutation.mutate({ id: editUnit.id, data: payload })
    else createMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse size={24} className="text-primary" /> Storage Units
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage physical stock locations across the restaurant</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 shadow-sm"
          >
            <Plus size={16} /> Add Location
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Warehouse size={14} className="text-primary" />
            {editUnit ? 'Edit Storage Unit' : 'New Storage Unit'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. Central Store"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Code *</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                required
                placeholder="e.g. MAIN"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
              <select
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                {STORAGE_UNIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Location'}
            </button>
            <button type="button" onClick={resetForm}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >Cancel</button>
          </div>
        </form>
      )}

      {sorted.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((unit) => {
                const typeInfo = STORAGE_UNIT_TYPES.find((t) => t.value === unit.type) || STORAGE_UNIT_TYPES[4]
                return (
                  <tr key={unit.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold shadow-sm bg-gradient-to-br ${
                          unit.isDefault ? 'from-amber-500 to-orange-600' : 'from-gray-400 to-gray-500'
                        }`}>
                          {unit.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900">{unit.name}</span>
                            {unit.isDefault && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                <Star size={10} fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{unit.code}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateMutation.mutate({ id: unit.id, data: { isActive: !unit.isActive } })}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                          unit.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {unit.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {unit.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!unit.isDefault && (
                          <button
                            onClick={() => setDefaultMutation.mutate(unit.id)}
                            className="flex items-center gap-1 h-7 px-2 rounded-md border border-amber-200 text-amber-600 text-xs hover:bg-amber-50 transition-all"
                            title="Set as default"
                          >
                            <Star size={11} /> Set Default
                          </button>
                        )}
                        <button onClick={() => startEdit(unit)}
                          className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-all"
                        ><Edit size={12} /></button>
                        {!unit.isDefault && (
                          <button onClick={() => { if (confirm(`Deactivate "${unit.name}"?`)) deleteMutation.mutate(unit.id) }}
                            className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-red-50 hover:text-red-500 transition-all"
                          ><Trash2 size={12} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Warehouse size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No storage units configured</p>
          <p className="text-xs text-gray-400 mt-1">Create your first storage location (e.g., Main Store).</p>
        </div>
      )}
    </div>
  )
}
