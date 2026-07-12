import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Loader2, Edit, Trash2, Armchair, ToggleLeft, ToggleRight,
  ArrowRight, Users,
} from 'lucide-react'
import { getZones, createZone, deleteZone, updateZone } from '../api/zone.api'
import type { Zone } from '../types/zone.types'

export function ZoneListPage() {
  const queryClient = useQueryClient()
  const { data: zones, isLoading } = useQuery({
    queryKey: ['zones-admin'],
    queryFn: () => getZones(true),
  })

  const [showForm, setShowForm] = useState(false)
  const [editZone, setEditZone] = useState<Zone | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const createMutation = useMutation({
    mutationFn: createZone,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['zones-admin'] }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateZone(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['zones-admin'] }); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteZone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones-admin'] }),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateZone(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones-admin'] }),
  })

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setShowForm(false); setEditZone(null)
  }

  const startEdit = (zone: Zone) => {
    setEditZone(zone); setFormName(zone.name); setFormDesc(zone.description || ''); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: formName, description: formDesc || undefined }
    if (editZone) updateMutation.mutate({ id: editZone.id, data: payload })
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Armchair size={24} className="text-primary" /> Zone Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage dining zones and their seating layouts</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 shadow-sm"
          >
            <Plus size={16} /> Add Zone
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">{editZone ? 'Edit Zone' : 'New Zone'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. AC Lounge"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <input
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Zone'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Zone Cards Grid */}
      {zones && zones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(zones || []).map((zone) => {
            const seed = zone.id.charCodeAt(zone.id.length - 1)
            const gradients = [
              'from-emerald-500 to-teal-600',
              'from-blue-500 to-indigo-600',
              'from-violet-500 to-purple-600',
              'from-amber-500 to-orange-600',
              'from-rose-500 to-pink-600',
              'from-cyan-500 to-sky-600',
            ]
            const gradient = gradients[seed % gradients.length]

            return (
              <div
                key={zone.id}
                className={`group rounded-xl border transition-all overflow-hidden ${
                  zone.isActive
                    ? 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                <div className="p-5 space-y-4">
                  {/* Zone info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                          <Armchair size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{zone.name}</h3>
                          {zone.description && (
                            <p className="text-xs text-gray-400 truncate">{zone.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: zone.id, isActive: !zone.isActive })}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                        zone.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {zone.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                    <Link
                      to="/zones/$zoneId"
                      params={{ zoneId: zone.id }}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                    >
                      <Users size={12} />
                      Floor Plan
                      <ArrowRight size={12} />
                    </Link>
                    <button
                      onClick={() => startEdit(zone)}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-all"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete zone "${zone.name}"?`)) deleteMutation.mutate(zone.id) }}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {(!zones || zones.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Armchair size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No zones configured yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Zone" to create your first dining zone.</p>
        </div>
      )}
    </div>
  )
}
