import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Clock, ChefHat, User } from 'lucide-react'
import { updateKotStatus, updateKotItemStatus } from '../api/kot.api'
import { STATUS_COLORS, STATUS_LABELS, STATION_LABELS } from '../types'
import type { Kot } from '../types'

interface Props {
  kot: Kot | null
  onClose: () => void
}

function ElapsedTime({ start }: { start: string | null }) {
  if (!start) return <span className="text-gray-400">—</span>
  const elapsed = Math.floor((Date.now() - new Date(start).getTime()) / 60000)
  const h = Math.floor(elapsed / 60)
  const m = elapsed % 60
  return <span className="font-mono text-sm">{h > 0 ? `${h}h ` : ''}{m}m</span>
}

export function KotDetailPanel({ kot, onClose }: Props) {
  const qc = useQueryClient()

  const markItem = useMutation({
    mutationFn: ({ kotId, itemId, status }: { kotId: string; itemId: string; status: string }) =>
      updateKotItemStatus(kotId, itemId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kots'] }),
  })

  const markKot = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateKotStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kots'] }),
  })

  if (!kot) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{kot.kotNumber}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[kot.status]?.split(' ')[0]} ${STATUS_COLORS[kot.status]?.split(' ')[1]}`}>
                  {STATUS_LABELS[kot.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{STATION_LABELS[kot.station]}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Clock size={12} /> Elapsed
              </div>
              <ElapsedTime start={kot.startedAt || kot.createdAt} />
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <ChefHat size={12} /> Station
              </div>
              <p className="text-sm font-medium">{STATION_LABELS[kot.station]}</p>
            </div>
            {kot.tableIds && kot.tableIds.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">Tables</div>
                <p className="text-sm font-medium">{kot.tableIds.join(', ')}</p>
              </div>
            )}
            {kot.preparedBy && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <User size={12} /> Chef
                </div>
                <p className="text-sm font-medium">{kot.preparedBy}</p>
              </div>
            )}
          </div>

          {kot.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium mb-0.5">Notes</p>
              <p className="text-sm text-amber-800">{kot.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Items ({kot.items.length})</h3>
            <div className="space-y-2">
              {kot.items.map((item) => (
                <div key={item.id} className={`rounded-xl border p-3 ${STATUS_COLORS[item.status] || 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.quantity}x</span>
                      <span className="text-sm font-medium">{item.itemName}</span>
                    </div>
                    <div className="flex gap-1">
                      {item.status === 'pending' && (
                        <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'preparing' })}
                          className="px-2.5 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                          Start
                        </button>
                      )}
                      {item.status === 'preparing' && (
                        <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'ready' })}
                          className="px-2.5 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
                          Ready
                        </button>
                      )}
                      {item.status === 'ready' && (
                        <button onClick={() => markItem.mutate({ kotId: kot.id, itemId: item.id, status: 'served' })}
                          className="px-2.5 py-1 text-xs rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                          Serve
                        </button>
                      )}
                      {item.status === 'served' && (
                        <span className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 font-medium">Served</span>
                      )}
                    </div>
                  </div>
                  {item.instructions && (
                    <p className="text-xs mt-1 opacity-70 italic">Note: {item.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KOT-Level Actions */}
          <div className="flex gap-2">
            {kot.status === 'pending' && (
              <button onClick={() => markKot.mutate({ id: kot.id, status: 'preparing' })}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors">
                Start All
              </button>
            )}
            {kot.status === 'preparing' && (
              <>
                <button onClick={() => markKot.mutate({ id: kot.id, status: 'ready' })}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors">
                  Mark All Ready
                </button>
                <button onClick={() => markKot.mutate({ id: kot.id, status: 'cancelled' })}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors">
                  Cancel KOT
                </button>
              </>
            )}
            {kot.status === 'ready' && (
              <button onClick={() => markKot.mutate({ id: kot.id, status: 'served' })}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
                Mark Served
              </button>
            )}
          </div>

          {/* Timeline */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-mono">{new Date(kot.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {kot.startedAt && (
                <div className="flex justify-between">
                  <span>Started</span>
                  <span className="font-mono">{new Date(kot.startedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {kot.completedAt && (
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-mono">{new Date(kot.completedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {kot.servedAt && (
                <div className="flex justify-between">
                  <span>Served</span>
                  <span className="font-mono">{new Date(kot.servedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
