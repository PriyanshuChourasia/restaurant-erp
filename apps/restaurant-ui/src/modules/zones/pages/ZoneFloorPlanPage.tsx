import { useState, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Loader2, Plus, Users, X, ArrowLeft, Table as TableIcon } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getZone,
  getZoneTables,
  assignTableToZone,
  updateTableStatus,
  updateTablePosition,
  getUnassignedTables,
} from '../api/zone.api'
import type { TableStatus } from '../../tables/types/table.types'
import { FloorPlanView } from '../components/FloorPlanView'

const TABLE_STATUSES = [
  { value: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'booked', label: 'Booked', color: 'bg-amber-100 text-amber-700' },
  { value: 'occupied', label: 'Occupied', color: 'bg-red-100 text-red-700' },
]

const statusSortRank: Record<string, number> = {
  available: 0,
  booked: 1,
  occupied: 2,
}

export function ZoneFloorPlanPage() {
  const { zoneId } = useParams({ from: '/zones/$zoneId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: zone, isLoading: zoneLoading } = useQuery({
    queryKey: ['zone-detail', zoneId],
    queryFn: () => getZone(zoneId),
    enabled: !!zoneId,
  })

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['zone-tables', zoneId],
    queryFn: () => getZoneTables(zoneId),
    enabled: !!zoneId,
  })

  const { data: unassigned } = useQuery({
    queryKey: ['tables-unassigned'],
    queryFn: () => getUnassignedTables(),
  })

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['zone-tables', zoneId] })
    queryClient.invalidateQueries({ queryKey: ['tables-unassigned'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  }, [queryClient, zoneId])

  const assignMutation = useMutation({
    mutationFn: ({ tableId, zoneId: zId }: { tableId: string; zoneId: string }) =>
      assignTableToZone(tableId, zId),
    onSuccess: () => invalidateQueries(),
  })

  const unassignMutation = useMutation({
    mutationFn: (tableId: string) => assignTableToZone(tableId, null),
    onSuccess: () => invalidateQueries(),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      updateTableStatus(id, status),
    onSuccess: () => invalidateQueries(),
  })

  const positionMutation = useMutation({
    mutationFn: ({ id, posX, posY }: { id: string; posX: number; posY: number }) =>
      updateTablePosition(id, posX, posY),
    onSuccess: () => invalidateQueries(),
  })

  const handleTableToggle = useCallback((tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId],
    )
  }, [])

  const handleAddTables = () => {
    setShowPicker(true)
  }

  const handleAssignTable = (tableId: string) => {
    assignMutation.mutate({ tableId, zoneId })
  }

  const handlePositionChange = (tableId: string, posX: number, posY: number) => {
    positionMutation.mutate({ id: tableId, posX, posY })
  }

  const isLoading = zoneLoading || tablesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-500">Zone not found</p>
      </div>
    )
  }

  const unassignedTables = (unassigned || []).filter(
    (t) => !tables?.some((zt) => zt.id === t.id),
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/zones' })}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate">{zone.name}</h1>
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {tables?.length || 0} table{(tables?.length || 0) !== 1 ? 's' : ''}
            </span>
            {zone.description && (
              <span className="hidden sm:block text-sm text-gray-400 truncate">— {zone.description}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleAddTables}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90 shadow-sm"
        >
          <Plus size={16} /> Add Tables
        </button>
      </div>

      {/* Floor Plan */}
      {tables && (
        <FloorPlanView
          zone={zone}
          tables={tables}
          selectedTableIds={selectedTableIds}
          onTableToggle={handleTableToggle}
          onPositionChange={handlePositionChange}
        />
      )}

      {/* Add Tables Picker */}
      {showPicker && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Plus size={14} className="text-primary" />
              Add Tables to {zone.name}
            </h3>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {unassignedTables.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {unassignedTables.map((table) => (
                <div key={table.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-all">
                  <div className={`w-2 h-2 rounded-full ${
                    table.status === 'available' ? 'bg-emerald-400' :
                    table.status === 'booked' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 flex-1">{table.label}</span>
                  <span className="text-xs text-gray-400">{table.capacity ? `Cap: ${table.capacity}` : '—'}</span>
                  <button
                    onClick={() => handleAssignTable(table.id)}
                    disabled={assignMutation.isPending}
                    className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    Add to Zone
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <TableIcon size={28} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No unassigned tables available</p>
              <p className="text-xs text-gray-300 mt-1">Create tables in the Tables page first.</p>
            </div>
          )}
        </div>
      )}

      {/* Table list panel */}
      {tables && tables.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users size={16} className="text-primary" />
              Tables in this Zone
            </div>
            <div className="flex items-center gap-2">
              {selectedTableIds.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      selectedTableIds.forEach((id) => unassignMutation.mutate(id))
                      setSelectedTableIds([])
                    }}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove from zone
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    onClick={() => setSelectedTableIds([])}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(tables || [])
              .filter((t) => t.isActive)
              .sort((a, b) => {
                const rankDiff = (statusSortRank[a.status] ?? 0) - (statusSortRank[b.status] ?? 0)
                if (rankDiff !== 0) return rankDiff
                return a.label.localeCompare(b.label, undefined, { numeric: true })
              })
              .map((table) => {
                const isSelected = selectedTableIds.includes(table.id)
                return (
                  <div
                    key={table.id}
                    className={`flex items-center gap-3 px-5 py-3 transition-all ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Selection */}
                    <button
                      onClick={() => handleTableToggle(table.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 hover:border-primary/60'
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {/* Label + status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{table.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          TABLE_STATUSES.find((s) => s.value === table.status)?.color || 'bg-gray-100'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {table.capacity ? `${table.capacity} seats` : 'No capacity set'}
                        {table.category === 'flexible' ? ' · Flexible' : table.category === 'online' ? ' · Online' : ' · Walk-in'}
                        {table.posX != null && table.posY != null ? ` · (${table.posX}, ${table.posY})` : ''}
                      </p>
                    </div>

                    {/* Status change */}
                    <select
                      value={table.status}
                      onChange={(e) => statusMutation.mutate({ id: table.id, status: e.target.value as TableStatus })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:border-primary/40 hover:border-gray-300 transition-all"
                    >
                      {TABLE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* Remove from zone */}
                    <button
                      onClick={() => unassignMutation.mutate(table.id)}
                      disabled={unassignMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                      title="Remove from zone"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tables && tables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <Users size={40} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No tables in this zone</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Tables" to group existing tables into this zone.</p>
        </div>
      )}
    </div>
  )
}
