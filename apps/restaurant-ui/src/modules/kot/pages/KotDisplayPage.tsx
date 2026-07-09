import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Printer, CheckCircle2, CookingPot, UtensilsCrossed } from 'lucide-react'
import { getActiveKots, updateKotItemStatus, updateKotStatus } from '../api/kot.api'

const STATIONS = ['all', 'main_kitchen', 'tandoor', 'beverages', 'desserts', 'snacks']

const STATION_LABELS: Record<string, string> = {
  main_kitchen: 'Main Kitchen',
  tandoor: 'Tandoor',
  beverages: 'Beverages',
  desserts: 'Desserts',
  snacks: 'Snacks',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  preparing: 'bg-blue-100 text-blue-800 border-blue-300',
  ready: 'bg-green-100 text-green-800 border-green-300',
  served: 'bg-gray-100 text-gray-500 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

export function KotDisplayPage() {
  const [station, setStation] = useState('all')
  const queryClient = useQueryClient()

  const { data: kots, isLoading } = useQuery({
    queryKey: ['kots', 'active', station],
    queryFn: () => getActiveKots(station === 'all' ? undefined : station),
    refetchInterval: 10000,
  })

  const markItem = useMutation({
    mutationFn: ({ kotId, itemId, status }: { kotId: string; itemId: string; status: string }) =>
      updateKotItemStatus(kotId, itemId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kots'] }),
  })

  const markKot = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateKotStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kots'] }),
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CookingPot size={28} className="text-primary" />
          <h1 className="text-xl font-bold text-gray-900">KOT Board</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {kots?.length || 0} active
          </span>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary btn-sm flex items-center gap-1">
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Station Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATIONS.map((s) => (
          <button key={s} onClick={() => setStation(s)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              station === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'all' ? 'All Stations' : STATION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* KOT Cards */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading orders...</div>
      ) : !kots?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <UtensilsCrossed size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium">No active KOTs</p>
          <p className="text-sm">New orders from POS will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-auto">
          {kots.map((kot: any) => (
            <div key={kot.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* KOT Header */}
              <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-lg">{kot.kotNumber}</span>
                  {kot.tableNumbers && kot.tableNumbers.length > 0 && <span className="ml-2 text-sm opacity-70">| {kot.tableNumbers.join(', ')}</span>}
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{STATION_LABELS[kot.station]}</span>
              </div>

              {/* KOT Items */}
              <div className="p-4 space-y-2">
                {kot.items.map((item: any) => (
                  <div key={item.id} className={`rounded-lg border p-3 transition-colors ${STATUS_COLORS[item.status] || ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{item.quantity}x</span>
                        <span className="font-medium text-sm">{item.itemName}</span>
                      </div>
                      <div className="flex gap-1">
                        {item.status === 'pending' && (
                          <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'preparing' })}
                            className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                            Start
                          </button>
                        )}
                        {item.status === 'preparing' && (
                          <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'ready' })}
                            className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1">
                            <CheckCircle2 size={12} /> Ready
                          </button>
                        )}
                        {item.status === 'ready' && (
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-medium">Ready ✓</span>
                        )}
                      </div>
                    </div>
                    {item.instructions && (
                      <p className="text-xs mt-1 opacity-70 italic">Note: {item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-4 flex gap-2">
                {kot.status === 'pending' && (
                  <button onClick={() => markKot.mutate({ id: kot.id, status: 'preparing' })}
                    className="flex-1 py-2 text-sm rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
                    Start Preparing
                  </button>
                )}
                {kot.status === 'preparing' && (
                  <button onClick={() => markKot.mutate({ id: kot.id, status: 'ready' })}
                    className="flex-1 py-2 text-sm rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
                    Mark All Ready
                  </button>
                )}
                {kot.notes && (
                  <p className="text-xs text-gray-400 italic mt-1">{kot.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
