import { useState, useCallback } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Hash, Users, Monitor, Armchair, AlertCircle, Clock, CalendarDays } from 'lucide-react'
import { getZones, getZoneTables, getAllTables } from '@/modules/zones/api/zone.api'
import { getTableConflict } from '@/modules/reservations/api/reservations.api'
import type { Zone } from '@/modules/zones/types/zone.types'
import type { Table } from '@/modules/tables/types/table.types'
import type { Reservation } from '@/modules/reservations/types/reservation.types'

interface SeatingPanelProps {
  selectedTableIds: string[]
  onTableToggle: (tableId: string) => void
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  available: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  booked: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  occupied: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200' },
}

const categoryIcons: Record<string, typeof Hash> = {
  online: Monitor,
  walk_in: Users,
  flexible: Armchair,
}

const statusSortRank: Record<string, number> = {
  available: 0,
  booked: 1,
  occupied: 2,
}

const ALL_ZONES = 'all'

export function SeatingPanel({ selectedTableIds, onTableToggle }: SeatingPanelProps) {
  const [activeZoneId, setActiveZoneId] = useState<string>(ALL_ZONES)

  const { data: zones } = useQuery({
    queryKey: ['zones-for-pos'],
    queryFn: () => getZones(),
  })

  const { data: tables } = useQuery({
    queryKey: ['zone-tables-for-pos', activeZoneId],
    queryFn: () => (activeZoneId === ALL_ZONES ? getAllTables() : getZoneTables(activeZoneId)),
  })

  // Fetch conflicts for all tables in the active zone in parallel
  const conflictQueries = useQueries({
    queries: (tables || [])
      .filter((t: Table) => t.isActive && t.status !== 'occupied')
      .map((table: Table) => ({
        queryKey: ['table-conflict', table.id],
        queryFn: () => getTableConflict(table.id, 120),
        staleTime: 30_000, // Refetch every 30 seconds
      })),
  })

  // Build a map of tableId → conflict reservation
  const conflictMap = new Map<string, Reservation>()
  if (tables) {
    tables.forEach((table: Table) => {
      const query = conflictQueries.find((_, i) => tables[i]?.id === table.id)
      if (query?.data) {
        conflictMap.set(table.id, query.data as Reservation)
      }
    })
  }

  const sortedZones = (zones || [])
    .filter((z: Zone) => z.isActive)
    .sort((a: Zone, b: Zone) => a.name.localeCompare(b.name))

  const zoneNameById = new Map<string, string>(
    (zones || []).map((z: Zone) => [z.id, z.name]),
  )

  const handleTableClick = useCallback(
    (table: Table) => {
      const conflict = conflictMap.get(table.id)
      if (conflict) {
        const d = new Date(conflict.scheduledFor)
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        const msg =
          `Table ${table.label} has a ${timeStr} reservation for ${conflict.customerName} (${conflict.partySize} guests) — seat walk-in anyway?`

        if (window.confirm(msg)) {
          onTableToggle(table.id)
        }
      } else {
        onTableToggle(table.id)
      }
    },
    [conflictMap, onTableToggle],
  )

  const getTableTooltip = (table: Table) => {
    if (table.status === 'occupied') return 'Occupied'
    const conflict = conflictMap.get(table.id)
    if (conflict) {
      const d = new Date(conflict.scheduledFor)
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return `${timeStr} · ${conflict.customerName} · ${conflict.partySize} guests`
    }
    if (table.status === 'booked') return 'Booked - click to confirm'
    return table.label
  }

  return (
    <div className="space-y-2">
      {/* Zone tabs */}
      {sortedZones.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveZoneId(ALL_ZONES)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeZoneId === ALL_ZONES
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {sortedZones.map((zone: Zone) => (
            <button
              key={zone.id}
              onClick={() => setActiveZoneId(zone.id)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeZoneId === zone.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {zone.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected table chips */}
      {selectedTableIds.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {selectedTableIds.map((id) => {
            const table = tables?.find((t: Table) => t.id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium"
              >
                <Hash size={10} />
                {table?.label || id.slice(0, 8)}
                <button
                  onClick={() => onTableToggle(id)}
                  className="hover:bg-primary/20 rounded-sm p-0.5 transition-colors"
                >
                  ✕
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Table grid */}
      {tables && tables.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tables
            .filter((t: Table) => t.isActive)
            .sort((a: Table, b: Table) => {
              const rankDiff = (statusSortRank[a.status] ?? 0) - (statusSortRank[b.status] ?? 0)
              if (rankDiff !== 0) return rankDiff
              return a.label.localeCompare(b.label, undefined, { numeric: true })
            })
            .map((table: Table) => {
              const isSelected = selectedTableIds.includes(table.id)
              const conflict = conflictMap.get(table.id)
              const hasConflict = !!conflict
              const selectable = table.status !== 'occupied'
              const colors = statusColors[table.status] || statusColors.available
              const CategoryIcon = categoryIcons[table.category] || Hash

              return (
                <button
                  key={table.id}
                  disabled={!selectable && !isSelected}
                  onClick={() => handleTableClick(table)}
                  title={getTableTooltip(table)}
                  className={`
                    relative px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
                    ${isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : selectable
                        ? `${colors.bg} ${colors.text} border ${colors.border} hover:shadow-sm hover:-translate-y-0.5`
                        : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    }
                    ${hasConflict && !isSelected ? 'ring-1 ring-amber-300' : ''}
                  `}
                >
                  <div className="flex items-center gap-1">
                    {hasConflict ? (
                      <CalendarDays size={10} className="text-amber-500" />
                    ) : (
                      <CategoryIcon size={10} />
                    )}
                    {table.label}
                    {hasConflict && (
                      <AlertCircle size={10} className="text-amber-500" />
                    )}
                    {table.status === 'booked' && !hasConflict && selectable && (
                      <AlertCircle size={10} className="text-amber-500" />
                    )}
                  </div>
                  {activeZoneId === ALL_ZONES && table.zoneId && zoneNameById.get(table.zoneId) && (
                    <span className="block text-[9px] opacity-60">{zoneNameById.get(table.zoneId)}</span>
                  )}
                  {/* Reservation info sub-line */}
                  {hasConflict && (
                    <span className="block text-[9px] opacity-70 mt-0.5 flex items-center gap-1">
                      <Clock size={8} />
                      {new Date(conflict.scheduledFor).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}{conflict.customerName}
                    </span>
                  )}
                  {!hasConflict && table.capacity && (
                    <span className="block text-[10px] opacity-60">Cap: {table.capacity}</span>
                  )}
                </button>
              )
            })}
        </div>
      )}

      {sortedZones.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          No zones configured. Add zones in seating management.
        </p>
      )}
    </div>
  )
}
