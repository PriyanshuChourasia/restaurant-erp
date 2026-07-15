import { useState } from 'react'
import { Building2, X, Plus, Trash2, Edit3, Check } from 'lucide-react'
import type { FloorDefinition } from '../hooks/useFloors'

interface ManageFloorsDialogProps {
  open: boolean
  floors: FloorDefinition[]
  onAdd: (level: number, label: string) => void
  onRename: (level: number, label: string) => void
  onRemove: (level: number) => void
  onClose: () => void
  nextLevel: number
}

export function ManageFloorsDialog({ open, floors, onAdd, onRename, onRemove, onClose, nextLevel }: ManageFloorsDialogProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editingLevel, setEditingLevel] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  if (!open) return null

  const handleAdd = () => {
    if (!newLabel.trim()) return
    onAdd(nextLevel, newLabel.trim())
    setNewLabel('')
    setShowAdd(false)
  }

  const handleRename = (level: number) => {
    if (!editLabel.trim()) return
    onRename(level, editLabel.trim())
    setEditingLevel(null)
    setEditLabel('')
  }

  const startRename = (floor: FloorDefinition) => {
    setEditingLevel(floor.level)
    setEditLabel(floor.label)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Floors</h2>
              <p className="text-sm text-gray-500">Add, rename, or remove floors</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Floor list */}
          <div className="space-y-2">
            {floors.map((floor) => (
              <div
                key={floor.level}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 shrink-0">
                  <Building2 size={15} />
                </div>

                {editingLevel === floor.level ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      className="flex-1 h-8 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(floor.level); if (e.key === 'Escape') setEditingLevel(null) }}
                    />
                    <button onClick={() => handleRename(floor.level)} className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-all">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{floor.label}</p>
                      <p className="text-xs text-gray-400">Level {floor.level}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => startRename(floor)} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => onRemove(floor.level)} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new floor */}
          {showAdd ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <input
                className="flex-1 h-9 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Basement, Mezzanine"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
              />
              <button onClick={handleAdd} className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                <Check size={15} />
              </button>
              <button onClick={() => { setShowAdd(false); setNewLabel('') }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Plus size={15} /> Add Floor
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
