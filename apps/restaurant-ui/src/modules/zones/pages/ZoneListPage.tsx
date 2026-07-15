import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Loader2, Edit, Trash2, Armchair, ToggleLeft, ToggleRight,
  ArrowRight, Users, Building2,
} from 'lucide-react'
import { getZones, createZone, deleteZone, updateZone } from '../api/zone.api'
import type { Zone } from '../types/zone.types'

const FLOOR_NAMES: Record<number, string> = {
  0: 'Ground Floor',
  1: 'First Floor',
  2: 'Second Floor',
  3: 'Third Floor',
  4: 'Fourth Floor',
  5: 'Rooftop',
}

function getFloorLabel(floor: number): string {
  return FLOOR_NAMES[floor] || `Floor ${floor}`
}

function groupByFloor(zones: Zone[]): Map<number, Zone[]> {
  const groups = new Map<number, Zone[]>()
  for (const z of zones) {
    const list = groups.get(z.floor) || []
    list.push(z)
    groups.set(z.floor, list)
  }
  return groups
}

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
  const [formFloor, setFormFloor] = useState(0)
  const [activeFloor, setActiveFloor] = useState<number | null>(null)

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

  const floorGroups = useMemo(() => zones ? groupByFloor(zones) : new Map(), [zones])
  const floors = useMemo(() => [...floorGroups.keys()].sort((a, b) => a - b), [floorGroups])
  const displayedFloors = activeFloor !== null ? [activeFloor] : floors

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormFloor(0); setShowForm(false); setEditZone(null)
  }

  const startEdit = (zone: Zone) => {
    setEditZone(zone); setFormName(zone.name); setFormDesc(zone.description || ''); setFormFloor(zone.floor); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: formName, description: formDesc || undefined, floor: formFloor }
    if (editZone) updateMutation.mutate({ id: editZone.id, data: payload })
    else createMutation.mutate(payload)
  }

  const seed = (id: string) => id.charCodeAt(id.length - 1)

  const gradients = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ]

  const floorColors = [
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-primary" /> Zone Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage dining zones and seating layouts across floors</p>
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
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={14} className="text-primary" />
            {editZone ? 'Edit Zone' : 'New Zone'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. AC Lounge"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Floor</label>
              <select
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
                value={formFloor}
                onChange={(e) => setFormFloor(Number(e.target.value))}
              >
                <option value={0}>Ground Floor</option>
                <option value={1}>First Floor</option>
                <option value={2}>Second Floor</option>
                <option value={3}>Third Floor</option>
                <option value={4}>Fourth Floor</option>
                <option value={5}>Rooftop</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional"
              />
            </div>
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

      {/* Floor Tabs */}
      {floors.length > 1 && (
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFloor(null)}
            className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
              activeFloor === null
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 size={13} />
            All Floors
          </button>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                activeFloor === floor
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building2 size={13} />
              {getFloorLabel(floor)}
              <span className="ml-0.5 opacity-60">({floorGroups.get(floor)?.length || 0})</span>
            </button>
          ))}
        </div>
      )}

      {/* Zone Cards Grouped by Floor */}
      {displayedFloors.map((floor) => {
        const floorZones = floorGroups.get(floor) || []
        const floorColor = floorColors[floor % floorColors.length]
        return (
          <div key={floor} className="mb-6">
            {/* Floor header */}
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">{getFloorLabel(floor)}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${floorColor}`}>
                {floorZones.length} zone{floorZones.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {floorZones.map((zone: Zone) => {
                const g = gradients[seed(zone.id) % gradients.length]

                return (
                  <div
                    key={zone.id}
                    className={`group rounded-xl border transition-all overflow-hidden ${
                      zone.isActive
                        ? 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${g}`} />

                    <div className="p-5 space-y-4">
                      {/* Zone info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${g} text-white shadow-sm`}>
                              <Armchair size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{zone.name}</h3>
                                <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${floorColor}`}>
                                  {getFloorLabel(zone.floor)}
                                </span>
                              </div>
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
                          <Edit size={12} />
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
          </div>
        )
      })}

      {/* Empty state */}
      {(!zones || zones.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Building2 size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No zones configured yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Zone" to create your first dining zone on any floor.</p>
        </div>
      )}
    </div>
  )
}
