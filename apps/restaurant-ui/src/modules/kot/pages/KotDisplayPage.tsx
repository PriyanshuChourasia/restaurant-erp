import { useState } from 'react'
import { Printer, CookingPot, UtensilsCrossed, Plus, ListOrdered, Clock, ChefHat } from 'lucide-react'
import { useActiveKots, useUpdateKotItemStatus, useUpdateKotStatus } from '../hooks/useKotQueries'
import { KotDetailPanel } from '../components/KotDetailPanel'
import { CreateKotDialog } from '../dialogs/CreateKotDialog'
import { STATIONS, STATION_LABELS } from '../types'
import type { Kot } from '../types'

function Elapsed({ start, created }: { start: string | null; created: string }) {
  const from = start || created
  const mins = Math.floor((Date.now() - new Date(from).getTime()) / 60000)
  if (mins < 1) return '< 1m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h > 0 ? `${h}h ` : ''}${m}m`
}

function KotCard({ kot, onSelect }: { kot: Kot; onSelect: () => void }) {
  const markItem = useUpdateKotItemStatus()
  const markKot = useUpdateKotStatus()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={onSelect}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between text-white ${
        kot.status === 'pending' ? 'bg-gray-700' :
        kot.status === 'preparing' ? 'bg-orange-600' :
        kot.status === 'ready' ? 'bg-emerald-600' :
        'bg-gray-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{kot.kotNumber}</span>
          {kot.tableIds && kot.tableIds.length > 0 && (
            <span className="text-xs opacity-80">{kot.tableIds.join(', ')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} /> <Elapsed start={kot.startedAt} created={kot.createdAt} />
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{STATION_LABELS[kot.station]}</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-1.5">
        {kot.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm text-gray-900 shrink-0">{item.quantity}x</span>
              <span className="text-sm text-gray-700 truncate">{item.itemName}</span>
              {item.instructions && <span className="text-[10px] text-amber-600 italic truncate">({item.instructions})</span>}
            </div>
            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {item.status === 'pending' && (
                <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'preparing' })}
                  className="px-2 py-1 text-[10px] rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors">
                  Start
                </button>
              )}
              {item.status === 'preparing' && (
                <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'ready' })}
                  className="px-2 py-1 text-[10px] rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors">
                  Ready
                </button>
              )}
              {item.status === 'ready' && (
                <span className="px-2 py-1 text-[10px] rounded-md bg-emerald-100 text-emerald-700 font-medium">Ready</span>
              )}
              {item.status === 'served' && (
                <span className="px-2 py-1 text-[10px] rounded-md bg-gray-100 text-gray-400 font-medium">Served</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="px-3 pb-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {kot.status === 'pending' && (
          <button onClick={() => markKot.mutate({ id: kot.id, status: 'preparing' })}
            className="flex-1 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
            Start Preparing
          </button>
        )}
        {kot.status === 'preparing' && (
          <>
            <button onClick={() => markKot.mutate({ id: kot.id, status: 'ready' })}
              className="flex-1 py-1.5 text-xs rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors">
              Mark All Ready
            </button>
            <button onClick={() => markKot.mutate({ id: kot.id, status: 'cancelled' })}
              className="py-1.5 px-3 text-xs rounded-lg bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors">
              Cancel
            </button>
          </>
        )}
        {kot.status === 'ready' && (
          <button onClick={() => markKot.mutate({ id: kot.id, status: 'served' })}
            className="flex-1 py-1.5 text-xs rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-800 transition-colors">
            Mark Served
          </button>
        )}
      </div>

      {kot.notes && (
        <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1 italic">{kot.notes}</p>
        </div>
      )}
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <CookingPot size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">KOT Board</h1>
            <p className="text-xs text-gray-400">Live kitchen display</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">
            <Plus size={15} /> New KOT
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium">
          <ListOrdered size={13} /> {kots?.length || 0} Active
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
          <Clock size={13} /> {pendingCount} Pending
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
          <ChefHat size={13} /> {preparingCount} Preparing
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
          <CookingPot size={13} /> {readyCount} Ready
        </div>
      </div>

      {/* Station Filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setStation('all')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            station === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          All Stations
        </button>
        {STATIONS.map((s) => (
          <button key={s} onClick={() => setStation(s)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              station === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {STATION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full" />
            <span className="text-sm">Loading orders...</span>
          </div>
        </div>
      ) : !kots?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <UtensilsCrossed size={56} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No active KOTs</p>
          <p className="text-sm text-gray-400 mb-4">All orders have been prepared and served</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            <Plus size={15} /> Create Test KOT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 overflow-auto pb-4">
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
