import { useState, useEffect } from 'react'
import { Building2, X, Plus, Loader2 } from 'lucide-react'
import type { Zone, CreateZoneRequest } from '../types/zone.types'
import type { FloorDefinition } from '../hooks/useFloors'

interface ZoneFormDialogProps {
  open: boolean
  editZone: Zone | null
  floors: FloorDefinition[]
  onSave: (data: CreateZoneRequest) => void
  onClose: () => void
  isSaving: boolean
  onManageFloors: () => void
}

export function ZoneFormDialog({ open, editZone, floors, onSave, onClose, isSaving, onManageFloors }: ZoneFormDialogProps) {
  const [name, setName] = useState('')
  const [floor, setFloor] = useState(0)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName(editZone?.name || '')
      setFloor(editZone?.floor ?? 0)
      setDescription(editZone?.description || '')
    }
  }, [open, editZone])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() || undefined, floor })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{editZone ? 'Edit Zone' : 'New Zone'}</h2>
              <p className="text-sm text-gray-500">{editZone ? 'Update zone details' : 'Add a new dining zone'}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone Name *</label>
            <input
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. AC Lounge, Garden Terrace"
              autoFocus
            />
          </div>

          {/* Floor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Floor</label>
              <button type="button" onClick={onManageFloors} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-all">
                <Plus size={12} /> Manage Floors
              </button>
            </div>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white transition-all"
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value))}
            >
              {floors.map((f) => (
                <option key={f.level} value={f.level}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — e.g. VIP section, Family area"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
              {isSaving ? 'Saving...' : editZone ? 'Update Zone' : 'Create Zone'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
