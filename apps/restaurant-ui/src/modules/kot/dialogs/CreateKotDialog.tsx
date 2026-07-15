import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2, CookingPot } from 'lucide-react'
import { useCreateKot } from '../hooks/useKotQueries'
import { STATIONS, STATION_LABELS } from '../types'
import type { KotStation } from '../types'

const ITEMS_API = '/items'

interface ItemOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateKotDialog({ open, onClose }: Props) {
  const [station, setStation] = useState<KotStation>('main_kitchen')
  const [notes, setNotes] = useState('')
  const [tableIds, setTableIds] = useState('')
  const [rows, setRows] = useState<Array<{ itemId: string; itemName: string; quantity: number; instructions: string }>>([
    { itemId: '', itemName: '', quantity: 1, instructions: '' },
  ])

  const { data: items } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: async () => {
      const { data: res } = await (await import('@/lib/axios-client')).apiClient.get<{ data: ItemOption[] }>(ITEMS_API)
      return res.data || res || []
    },
  })

  const createKot = useCreateKot()

  const handleSubmit = async () => {
    if (!rows.every((r) => r.itemId)) return
    await createKot.mutateAsync({
      station,
      notes: notes || undefined,
      tableIds: tableIds ? tableIds.split(',').map((t) => t.trim()) : undefined,
      items: rows.map((r) => ({
        itemId: r.itemId,
        itemName: r.itemName,
        quantity: r.quantity,
        instructions: r.instructions || undefined,
      })),
    })
    setRows([{ itemId: '', itemName: '', quantity: 1, instructions: '' }])
    setNotes('')
    setTableIds('')
    setStation('main_kitchen')
    onClose()
  }

  const addRow = () => setRows([...rows, { itemId: '', itemName: '', quantity: 1, instructions: '' }])

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: string, value: string | number) => {
    const updated = [...rows]
    ;(updated[idx] as any)[field] = value
    if (field === 'itemId') {
      const item = (items as ItemOption[] | undefined)?.find((i) => i.id === value)
      if (item) updated[idx].itemName = item.name
    }
    setRows(updated)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
              <CookingPot size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create KOT</h2>
              <p className="text-xs text-gray-400">New kitchen order ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Station */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Station</label>
            <div className="grid grid-cols-3 gap-2">
              {STATIONS.map((s) => (
                <button key={s} type="button" onClick={() => setStation(s)}
                  className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    station === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}>
                  {STATION_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Table IDs */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Table Numbers</label>
            <input type="text" value={tableIds} onChange={(e) => setTableIds(e.target.value)}
              placeholder="e.g. T5, T7 (comma separated)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button type="button" onClick={addRow}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={row.itemId} onChange={(e) => updateRow(idx, 'itemId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="">Select item...</option>
                      {(items as ItemOption[] | undefined)?.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <input type="number" min={1} value={row.quantity} onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <button onClick={() => removeRow(idx)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input type="text" value={row.instructions} onChange={(e) => updateRow(idx, 'instructions', e.target.value)}
                    placeholder="Special instructions (optional)"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">KOT Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes for the kitchen..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createKot.isPending || !rows.some((r) => r.itemId)}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {createKot.isPending ? 'Creating...' : 'Create KOT'}
          </button>
        </div>
      </div>
    </div>
  )
}
