import { Armchair, Users, Monitor } from 'lucide-react'
import type { Table } from '../../tables/types/table.types'

interface TableBlockProps {
  table: Table
  isSelected: boolean
  onSelect: (tableId: string) => void
  isDraggable?: boolean
}

const statusConfig: Record<string, { label: string; top: string; side: string; glow: string }> = {
  available: {
    label: 'Available',
    top: 'bg-emerald-400',
    side: 'bg-emerald-600',
    glow: 'shadow-emerald-400/30',
  },
  booked: {
    label: 'Booked',
    top: 'bg-amber-400',
    side: 'bg-amber-600',
    glow: 'shadow-amber-400/30',
  },
  occupied: {
    label: 'Occupied',
    top: 'bg-red-400',
    side: 'bg-red-600',
    glow: 'shadow-red-400/30',
  },
}

const categoryIcons: Record<string, typeof Armchair> = {
  walk_in: Users,
  online: Monitor,
  flexible: Armchair,
}

export function TableBlock({ table, isSelected, onSelect, isDraggable }: TableBlockProps) {
  const cfg = statusConfig[table.status] || statusConfig.available
  const CategoryIcon = categoryIcons[table.category] || Armchair
  const isDisabled = table.status === 'occupied' && !isSelected

  return (
    <button
      onClick={() => onSelect(table.id)}
      disabled={isDisabled}
      title={`${table.label} — ${cfg.label}${table.capacity ? ` (Cap: ${table.capacity})` : ''}`}
      className="group"
    >
      {/* 3D block wrapper */}
      <div
        className={`
          relative w-[72px] h-[72px] transition-all duration-200
          ${isDisabled ? 'opacity-40 cursor-not-allowed' : cursorPointer}
          ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
      >
        {/* Floor shadow */}
        <div
          className={`
            absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-14 h-3
            rounded-full blur-sm transition-all duration-200
            ${cfg.glow} ${isSelected ? 'scale-125 opacity-80' : 'opacity-40 group-hover:opacity-60'}
          `}
        />

        {/* 3D isometric top face */}
        <div
          className={`
            absolute inset-0 rounded-lg border-2 border-white/30
            transition-all duration-200
            ${cfg.top}
            ${isSelected
              ? 'ring-2 ring-primary ring-offset-2 shadow-xl'
              : 'group-hover:shadow-lg'
            }
            flex flex-col items-center justify-center gap-0.5
            ${isSelected ? 'z-20' : ''}
          `}
          style={{
            transform: 'rotateX(55deg) rotateZ(45deg)',
            boxShadow: isSelected
              ? `0 8px 32px rgba(0,0,0,0.2)`
              : `0 2px 8px rgba(0,0,0,0.1)`,
          }}
        >
          <CategoryIcon size={14} className="text-white drop-shadow-sm" />
          <span className="text-[10px] font-bold text-white drop-shadow-sm leading-none">
            {table.label}
          </span>
        </div>

        {/* 3D right side face */}
        <div
          className={`
            absolute -right-[10px] top-1 w-[10px] h-[68px] rounded-r-sm
            transition-all duration-200
            ${cfg.side}
            ${isSelected ? 'brightness-110' : ''}
          `}
          style={{ transform: 'skewY(35deg)', transformOrigin: 'left top' }}
        />

        {/* 3D left side face */}
        <div
          className={`
            absolute -bottom-[10px] left-1 h-[10px] w-[68px] rounded-b-sm
            transition-all duration-200
            ${cfg.side}
            ${isSelected ? 'brightness-110' : ''}
          `}
          style={{ transform: 'skewX(35deg)', transformOrigin: 'left top' }}
        />

        {/* Status indicator dot */}
        <div
          className={`
            absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white
            transition-all duration-200 z-30
            ${table.status === 'available' ? 'bg-emerald-400' : ''}
            ${table.status === 'booked' ? 'bg-amber-400 animate-pulse' : ''}
            ${table.status === 'occupied' ? 'bg-red-500' : ''}
            ${isSelected ? 'scale-125' : ''}
          `}
        />
      </div>
    </button>
  )
}

const cursorPointer = 'cursor-pointer'
