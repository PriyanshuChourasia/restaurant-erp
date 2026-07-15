import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Loader2, Edit, Trash2, Table, ToggleLeft, ToggleRight,
  Users, MapPin, Circle,
} from 'lucide-react'
import { getTables, createTable, deleteTable, updateTable, updateTableStatus, assignTableToZone, getZonesBrief } from '../api/table.api'
import type { Table as TableType, CreateTableRequest, TableStatus } from '../types/table.types'

export function TableListPage() {
  const queryClient = useQueryClient()
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables(),
  })

  const { data: zones } = useQuery({
    queryKey: ['zones-brief'],
    queryFn: () => getZonesBrief(),
  })

  const [showForm, setShowForm] = useState(false)
  const [editTable, setEditTable] = useState<TableType | null>(null)
  const [formLabel, setFormLabel] = useState('')
  const [formCapacity, setFormCapacity] = useState('')
  const [formCategory, setFormCategory] = useState<string>('walk_in')
  const [formZoneId, setFormZoneId] = useState<string>('')

  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTableRequest }) => updateTable(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => updateTableStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  })

  const zoneAssignMutation = useMutation({
    mutationFn: ({ id, zoneId }: { id: string; zoneId: string | null }) => assignTableToZone(id, zoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  })

  const resetForm = () => {
    setFormLabel(''); setFormCapacity(''); setFormCategory('walk_in'); setFormZoneId('')
    setShowForm(false); setEditTable(null)
  }

  const startEdit = (table: TableType) => {
    setEditTable(table)
    setFormLabel(table.label)
    setFormCapacity(table.capacity ? String(table.capacity) : '')
    setFormCategory(table.category)
    setFormZoneId(table.zoneId || '')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateTableRequest = {
      label: formLabel,
      category: formCategory as any,
      capacity: formCapacity ? parseInt(formCapacity, 10) : undefined,
      zoneId: formZoneId || undefined,
    }
    if (editTable) updateMutation.mutate({ id: editTable.id, data: payload })
    else createMutation.mutate(payload)
  }

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    booked: 'bg-amber-100 text-amber-700 border-amber-200',
    occupied: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  const statusDots: Record<string, string> = {
    available: 'text-emerald-500',
    booked: 'text-amber-500',
    occupied: 'text-blue-500',
  }

  const statusSortRank: Record<string, number> = {
    available: 0,
    booked: 1,
    occupied: 2,
  }

  const sortedTables = [...(tables || [])].sort((a, b) => {
    const rankDiff = (statusSortRank[a.status] ?? 0) - (statusSortRank[b.status] ?? 0)
    if (rankDiff !== 0) return rankDiff
    return a.label.localeCompare(b.label, undefined, { numeric: true })
  })

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return '—'
    return zones?.find((z) => z.id === zoneId)?.name || 'Unknown Zone'
  }

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
            <Table size={24} className="text-primary" /> Tables
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage dining tables — no zone required</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 shadow-sm"
          >
            <Plus size={16} /> Add Table
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            {editTable ? 'Edit Table' : 'New Table'}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Label *</label>
              <input
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                required
                placeholder="e.g. T1, Window-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Capacity</label>
              <input
                type="number"
                min={1}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                placeholder="4"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <select
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                <option value="walk_in">Walk-in</option>
                <option value="online">Online</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Zone</label>
              <select
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
                value={formZoneId}
                onChange={(e) => setFormZoneId(e.target.value)}
              >
                <option value="">— Unassigned —</option>
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
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
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Table'}
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

      {/* Tables Table */}
      {tables && tables.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Label</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Capacity</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Zone</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTables.map((table) => (
                <tr key={table.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold shadow-sm ${
                        table.status === 'available' ? 'bg-emerald-500' :
                        table.status === 'booked' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}>
                        {table.label ? table.label.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{table.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                      statusColors[table.status] || 'bg-gray-100 text-gray-600'
                    }`}>
                      <Circle size={6} fill="currentColor" className={statusDots[table.status]} />
                      {table.status ? table.status.charAt(0).toUpperCase() + table.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{table.category}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users size={14} className="text-gray-400" />
                      {table.capacity || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {table.zoneId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <MapPin size={10} />
                          {getZoneName(table.zoneId)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick status toggle */}
                      {table.status === 'available' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: table.id, status: 'booked' })}
                          className="flex items-center gap-1 h-7 px-2 rounded-md border border-amber-200 text-amber-600 text-xs hover:bg-amber-50 transition-all"
                          title="Mark as booked"
                        >
                          <ToggleRight size={12} /> Book
                        </button>
                      )}
                      {table.status === 'booked' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: table.id, status: 'available' })}
                          className="flex items-center gap-1 h-7 px-2 rounded-md border border-emerald-200 text-emerald-600 text-xs hover:bg-emerald-50 transition-all"
                          title="Mark as available"
                        >
                          <ToggleLeft size={12} /> Free
                        </button>
                      )}
                      {/* Zone reassign */}
                      <select
                        value={table.zoneId || ''}
                        onChange={(e) => zoneAssignMutation.mutate({ id: table.id, zoneId: e.target.value || null })}
                        className="h-7 rounded-md border border-gray-200 text-xs text-gray-500 px-1.5 bg-transparent hover:bg-gray-50 transition-all cursor-pointer"
                        title="Assign to zone"
                      >
                        <option value="">— Zone —</option>
                        {(zones || []).map((z) => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                      {/* Edit */}
                      <button
                        onClick={() => startEdit(table)}
                        className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-all"
                        title="Edit table"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete table "${table.label}"?`)) deleteMutation.mutate(table.id)
                        }}
                        className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                        title="Delete table"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {(!tables || tables.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Table size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No tables configured yet</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">
            Click "Add Table" to create your first dining table. Tables can exist without a zone — group them into zones later.
          </p>
        </div>
      )}

      {/* Stats footer */}
      {tables && tables.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Circle size={6} fill="currentColor" className="text-emerald-500" /> {tables.filter((t) => t.status === 'available').length} Available</span>
          <span className="flex items-center gap-1"><Circle size={6} fill="currentColor" className="text-amber-500" /> {tables.filter((t) => t.status === 'booked').length} Booked</span>
          <span className="flex items-center gap-1"><Circle size={6} fill="currentColor" className="text-blue-500" /> {tables.filter((t) => t.status === 'occupied').length} Occupied</span>
          <span className="flex items-center gap-1 text-indigo-400"><MapPin size={11} /> {tables.filter((t) => !t.zoneId).length} Unassigned</span>
        </div>
      )}
    </div>
  )
}
