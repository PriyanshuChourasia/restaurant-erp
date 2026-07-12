import { useState, useRef, useCallback } from 'react'
import { Hash, RotateCw, Move } from 'lucide-react'
import type { Zone } from '../types/zone.types'
import type { Table } from '../../tables/types/table.types'
import { TableBlock } from './TableBlock'

interface FloorPlanViewProps {
  zone: Zone
  tables: Table[]
  selectedTableIds: string[]
  onTableToggle: (tableId: string) => void
  onPositionChange?: (tableId: string, posX: number, posY: number) => void
}

export function FloorPlanView({ zone, tables, selectedTableIds, onTableToggle, onPositionChange }: FloorPlanViewProps) {
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeTables = tables.filter((t) => t.isActive)

  const CANVAS_WIDTH = 600
  const CANVAS_HEIGHT = 400
  const BLOCK_SIZE = 72

  const stats = {
    total: activeTables.length,
    available: activeTables.filter((t) => t.status === 'available').length,
    booked: activeTables.filter((t) => t.status === 'booked').length,
    occupied: activeTables.filter((t) => t.status === 'occupied').length,
  }

  const defaultPositions = activeTables.map((t, i) => ({
    ...t,
    posX: t.posX ?? 80 + (i % 5) * 100,
    posY: t.posY ?? 60 + Math.floor(i / 5) * 100,
  }))

  const handlePointerDown = useCallback(
    (tableId: string, e: React.PointerEvent) => {
      e.preventDefault()
      setDragging(tableId)
      const el = (e.target as HTMLElement).closest('[data-table-id]') as HTMLElement
      if (el) el.setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current || !onPositionChange) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.round(e.clientX - rect.left - BLOCK_SIZE / 2)
      const y = Math.round(e.clientY - rect.top - BLOCK_SIZE / 2)
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - BLOCK_SIZE, x))
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - BLOCK_SIZE, y))

      // Update position visually while dragging
      const el = containerRef.current.querySelector(`[data-table-id="${dragging}"]`) as HTMLElement
      if (el) {
        el.style.left = `${clampedX}px`
        el.style.top = `${clampedY}px`
      }
    },
    [dragging, onPositionChange],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current || !onPositionChange) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.round(e.clientX - rect.left - BLOCK_SIZE / 2)
      const y = Math.round(e.clientY - rect.top - BLOCK_SIZE / 2)
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - BLOCK_SIZE, x))
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - BLOCK_SIZE, y))

      onPositionChange(dragging, clampedX, clampedY)
      setDragging(null)
    },
    [dragging, onPositionChange],
  )

  const getPosition = (table: Table, index: number) => {
    if (dragging === table.id) return null // Don't override during drag
    return {
      left: table.posX ?? 80 + (index % 5) * 100,
      top: table.posY ?? 60 + Math.floor(index / 5) * 100,
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `perspective(800px) rotateX(20deg) rotateZ(${rotation}deg)`,
          transformStyle: 'preserve-3d',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragging(null)}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Tables positioned absolutely */}
        {defaultPositions.map((table, index) => {
          const pos = getPosition(table, index)
          if (!pos) return null
          return (
            <div
              key={table.id}
              data-table-id={table.id}
              className="absolute transition-none"
              style={{
                left: pos.left,
                top: pos.top,
                zIndex: selectedTableIds.includes(table.id) ? 20 : 1,
              }}
              onPointerDown={(e) => handlePointerDown(table.id, e)}
            >
              <TableBlock
                table={table}
                isSelected={selectedTableIds.includes(table.id)}
                onSelect={onTableToggle}
                isDraggable={!!onPositionChange}
              />
            </div>
          )
        })}

        {/* Empty canvas hint */}
        {activeTables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/20 text-sm font-mono">Drop tables here</p>
          </div>
        )}

        {/* Drag indicator */}
        {dragging && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-white/60 text-xs backdrop-blur-sm z-30">
            <Move size={12} />
            Drag to position
          </div>
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/50 font-medium">{zone.name}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300/80">{stats.available} free</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300/80">{stats.booked} booked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-300/80">{stats.occupied} occupied</span>
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/40">{stats.total} total</span>
        </div>
        <button
          onClick={() => setRotation((r) => r + 90)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 text-xs transition-all"
          title="Rotate view"
        >
          <RotateCw size={13} />
          Rotate
        </button>
      </div>

      {/* Selected count */}
      {selectedTableIds.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2 bg-primary/10 border-t border-primary/20">
          <Hash size={12} className="text-primary" />
          <span className="text-xs text-primary font-medium">
            {selectedTableIds.length} table{selectedTableIds.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}
    </div>
  )
}
