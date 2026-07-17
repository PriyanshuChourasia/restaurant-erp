import { useState } from 'react'
import { Printer, CookingPot, UtensilsCrossed, Plus, ListOrdered, Clock, ChefHat, Flame, AlertTriangle, Undo2 } from 'lucide-react'
import { useActiveKots, useUpdateKotItemStatus, useUpdateKotStatus, useUpdateKotItemAvailability } from '../hooks/useKotQueries'
import { KotDetailPanel } from '../components/KotDetailPanel'
import { CreateKotDialog } from '../dialogs/CreateKotDialog'
import { STATIONS, STATION_LABELS, STATION_ICONS } from '../types'
import type { Kot } from '../types'

const URGENT_MINS = 15

function elapsedMinutes(from: string) {
  return Math.floor((Date.now() - new Date(from).getTime()) / 60000)
}

function formatElapsed(mins: number) {
  if (mins < 1) return '< 1m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h > 0 ? `${h}h ` : ''}${m}m`
}

const statusHeaderStyles: Record<string, string> = {
  pending: 'bg-gradient-to-r from-gray-700 to-gray-800',
  preparing: 'bg-gradient-to-r from-orange-500 to-amber-600',
  ready: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  served: 'bg-gradient-to-r from-gray-400 to-gray-500',
}

function KotCard({ kot, onSelect }: { kot: Kot; onSelect: () => void }) {
  const markItem = useUpdateKotItemStatus()
  const markKot = useUpdateKotStatus()
  const markAvailability = useUpdateKotItemAvailability()

  const mins = elapsedMinutes(kot.startedAt || kot.createdAt)
  const isUrgent = mins >= URGENT_MINS && (kot.status === 'pending' || kot.status === 'preparing')

  return (
    <div
      onClick={onSelect}
      className={`group bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        isUrgent ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between text-white ${statusHeaderStyles[kot.status] || statusHeaderStyles.pending}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="font-bold text-sm sm:text-base tracking-tight shrink-0">{kot.kotNumber}</span>
          {kot.tableIds && kot.tableIds.length > 0 && (
            <span className="text-[10px] sm:text-xs opacity-80 truncate min-w-0">{kot.tableIds.join(', ')}</span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 font-medium ${
            isUrgent ? 'bg-red-500 animate-pulse' : 'bg-white/20'
          }`}>
            {isUrgent ? <Flame size={9} /> : <Clock size={9} />} {formatElapsed(mins)}
          </span>
          <span className="text-[9px] sm:text-[10px] bg-white/20 px-1 sm:px-1.5 py-0.5 rounded-full hidden sm:inline">
            {STATION_ICONS[kot.station]} {STATION_LABELS[kot.station]}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {kot.items.map((item) => (
          <div key={item.id} className={`px-3 py-1.5 sm:px-4 sm:py-2 ${item.isUnavailable ? 'bg-red-50/60' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="flex items-center justify-center h-4 min-w-4 sm:h-5 sm:min-w-5 px-0.5 sm:px-1 rounded-md bg-gray-100 text-[10px] sm:text-[11px] font-bold text-gray-700 shrink-0">
                  {item.quantity}×
                </span>
                <span className={`text-xs sm:text-sm truncate ${item.isUnavailable ? 'text-red-700 line-through decoration-red-400' : 'text-gray-700'}`}>{item.itemName}</span>
                {item.instructions && <span className="text-[9px] sm:text-[10px] text-amber-600 italic truncate hidden sm:inline">({item.instructions})</span>}
              </div>
              <div className="flex gap-0.5 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {item.status === 'pending' && (
                  <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'preparing' })}
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors">
                    Start
                  </button>
                )}
                {item.status === 'preparing' && (
                  <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'ready' })}
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors">
                    Ready
                  </button>
                )}
                {item.status === 'ready' && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] rounded-md bg-emerald-100 text-emerald-700 font-medium">Ready</span>
                )}
                {item.status === 'served' && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] rounded-md bg-gray-100 text-gray-400 font-medium">Served</span>
                )}
                {item.isUnavailable ? (
                  <button
                    title="Mark available again"
                    onClick={() => markAvailability.mutate({ kotId: kot.id, itemId: item.id, isUnavailable: false })}
                    className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <Undo2 size={11} />
                  </button>
                ) : (
                  <button
                    title="Flag as unavailable"
                    onClick={() => {
                      const note = window.prompt(`Why is "${item.itemName}" unavailable?`, '') || undefined
                      markAvailability.mutate({ kotId: kot.id, itemId: item.id, isUnavailable: true, note })
                    }}
                    className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-md text-gray-300 hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <AlertTriangle size={11} />
                  </button>
                )}
              </div>
            </div>
            {item.isUnavailable && item.unavailableNote && (
              <p className="mt-0.5 text-[9px] sm:text-[10px] text-red-600 pl-5 sm:pl-7">⚠ {item.unavailableNote}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="px-2.5 py-2 sm:px-3 sm:py-3 flex gap-1 sm:gap-1.5 bg-gray-50/60 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        {kot.status === 'pending' && (
          <button onClick={() => markKot.mutate({ id: kot.id, status: 'preparing' })}
            className="flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-sm">
            Start Preparing
          </button>
        )}
        {kot.status === 'preparing' && (
          <>
            <button onClick={() => markKot.mutate({ id: kot.id, status: 'ready' })}
              className="flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
              Mark Ready
            </button>
            <button onClick={() => markKot.mutate({ id: kot.id, status: 'cancelled' })}
              className="py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs rounded-lg bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors">
              Cancel
            </button>
          </>
        )}
        {kot.status === 'ready' && (
          <button onClick={() => markKot.mutate({ id: kot.id, status: 'served' })}
            className="flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm">
            Mark Served
          </button>
        )}
      </div>

      {kot.notes && (
        <div className="px-2.5 pb-2 sm:px-3 sm:pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
          <p className="text-[9px] sm:text-[10px] text-amber-700 bg-amber-50 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 italic">{kot.notes}</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0 ${tone}`}>{icon}</div>
      <div>
        <p className="text-base sm:text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] sm:text-[11px] text-gray-400">{label}</p>
      </div>
    </div>
  )
}

export function KotDisplayPage() {
  const [station, setStation] = useState<string>('all')
  const [selectedKot, setSelectedKot] = useState<Kot | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: kots, isLoading } = useActiveKots(station === 'all' ? undefined : station)

  const pendingCount = kots?.filter((k) => k.status === 'pending').length || 0
  const preparingCount = kots?.filter((k) => k.status === 'preparing').length || 0
  const readyCount = kots?.filter((k) => k.status === 'ready').length || 0

  return (
    <div className="h-full flex flex-col bg-gray-50/50 px-3 sm:px-4 md:px-6 pt-2 sm:pt-2.5 md:pt-3 pb-3 sm:pb-4 md:pb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20">
            <CookingPot size={18} className="sm:hidden" />
            <CookingPot size={22} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">KOT Board</h1>
            <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live kitchen display
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-colors shadow-sm shadow-orange-500/20">
            <Plus size={14} /> <span className="hidden xs:inline">New KOT</span><span className="xs:hidden">New</span>
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors">
            <Printer size={14} /> <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
        <StatCard icon={<ListOrdered size={15} className="text-white" />} value={kots?.length || 0} label="Active Orders" tone="bg-gray-900" />
        <StatCard icon={<Clock size={15} className="text-yellow-700" />} value={pendingCount} label="Pending" tone="bg-yellow-100" />
        <StatCard icon={<ChefHat size={15} className="text-blue-700" />} value={preparingCount} label="Preparing" tone="bg-blue-100" />
        <StatCard icon={<CookingPot size={15} className="text-emerald-700" />} value={readyCount} label="Ready" tone="bg-emerald-100" />
      </div>

      {/* Station Filter */}
      <div className="flex gap-1 sm:gap-1.5 mb-3 sm:mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button onClick={() => setStation('all')}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
            station === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}>
          All
        </button>
        {STATIONS.map((s) => (
          <button key={s} onClick={() => setStation(s)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-full font-medium transition-all flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
              station === s ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}>
            <span>{STATION_ICONS[s]}</span> {STATION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 flex-1 overflow-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
              <div className="h-10 sm:h-11 bg-gray-100" />
              <div className="p-2.5 sm:p-3 space-y-2">
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="p-2.5 sm:p-3">
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : !kots?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gray-100 mb-3 sm:mb-4">
            <UtensilsCrossed size={28} className="opacity-30 sm:hidden" />
            <UtensilsCrossed size={36} className="opacity-30 hidden sm:block" />
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-500">No active KOTs</p>
          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">All orders have been prepared and served</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-600 shadow-sm shadow-orange-500/20">
            <Plus size={14} /> Create Test KOT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 flex-1 overflow-auto pb-4">
          {kots.map((kot) => (
            <KotCard key={kot.id} kot={kot} onSelect={() => setSelectedKot(kot)} />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <KotDetailPanel kot={selectedKot} onClose={() => setSelectedKot(null)} />

      {/* Create Dialog */}
      <CreateKotDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
