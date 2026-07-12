import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Search, CalendarDays, Clock, Loader2,
  Edit, Trash2, Users, Phone, CheckCircle, XCircle,
} from 'lucide-react'
import { useReservations, useCreateReservation, useUpdateReservation, useUpdateReservationStatus, useSeatReservation, useDeleteReservation } from '../hooks/useReservationsQueries'
import type { Reservation, CreateReservationRequest } from '../types/reservation.types'
import { getTables } from '@/modules/tables/api/table.api'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  seated: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  no_show: 'bg-purple-100 text-purple-700 border-purple-200',
}

export function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editReservation, setEditReservation] = useState<Reservation | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPartySize, setFormPartySize] = useState(4)
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formTime, setFormTime] = useState('19:00')
  const [formSource, setFormSource] = useState('phone')
  const [formTableId, setFormTableId] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const { data: reservations, isLoading } = useReservations()
  const { data: tables } = useQuery({
    queryKey: ['tables-for-reservations'],
    queryFn: () => getTables(),
  })

  const createMutation = useCreateReservation()
  const updateMutation = useUpdateReservation()
  const statusMutation = useUpdateReservationStatus()
  const seatMutation = useSeatReservation()
  const deleteMutation = useDeleteReservation()

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormPartySize(4)
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormTime('19:00'); setFormSource('phone'); setFormTableId('')
    setShowForm(false); setEditReservation(null)
  }

  const startEdit = (r: Reservation) => {
    setEditReservation(r)
    setFormName(r.customerName)
    setFormPhone(r.customerPhone || '')
    setFormPartySize(r.partySize)
    const d = new Date(r.scheduledFor)
    setFormDate(d.toISOString().slice(0, 10))
    setFormTime(d.toTimeString().slice(0, 5))
    setFormSource(r.source)
    setFormTableId(r.tableId || '')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const scheduledFor = new Date(`${formDate}T${formTime}:00`).toISOString()
    const payload: CreateReservationRequest = {
      customerName: formName,
      customerPhone: formPhone || undefined,
      partySize: formPartySize,
      source: formSource,
      tableId: formTableId || undefined,
      scheduledFor,
    }
    if (editReservation) {
      updateMutation.mutate({ id: editReservation.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
    resetForm()
  }

  // Stats calculation
  const todayReservations = (reservations || []).filter((r) =>
    r.scheduledFor.startsWith(today),
  )
  const confirmedToday = todayReservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending',
  )
  const tablesAvailable = tables?.filter((t) => t.status === 'available').length || 0
  const guestsExpected = confirmedToday.reduce((s, r) => s + r.partySize, 0)
  const pendingRequests = (reservations || []).filter((r) => r.status === 'pending').length

  const filteredReservations = (reservations || [])
    .filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          r.customerName.toLowerCase().includes(q) ||
          (r.customerPhone?.includes(q)) ||
          r.id.includes(q)
        )
      }
      return true
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

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
            <CalendarDays size={24} className="text-primary" /> Reservations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage table bookings and reservation requests</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={16} /> New Reservation
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Today's Reservations", value: todayReservations.length.toString(), icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
          { label: 'Guests Expected', value: guestsExpected.toString(), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tables Available', value: tablesAvailable.toString(), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Requests', value: pendingRequests.toString(), icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            {editReservation ? `Edit ${editReservation.customerName}` : 'New Reservation'}
          </h3>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                placeholder="Guest name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Party Size *</label>
              <input
                type="number"
                min={1}
                value={formPartySize}
                onChange={(e) => setFormPartySize(parseInt(e.target.value) || 1)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Time</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Source</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
              >
                <option value="phone">Phone</option>
                <option value="online">Online</option>
                <option value="walk_in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Table</label>
              <select
                value={formTableId}
                onChange={(e) => setFormTableId(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 bg-white"
              >
                <option value="">— Auto-assign —</option>
                {(tables || [])
                  .filter((t) => t.isActive && t.status !== 'occupied')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}{t.capacity ? ` (Cap: ${t.capacity})` : ''}
                    </option>
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
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save'}
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

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reservations..."
            className="w-full h-9 rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-1">
          {['', 'pending', 'confirmed', 'seated', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      {filteredReservations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Guest</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Party</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date / Time</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Table</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReservations.map((r) => {
                const d = new Date(r.scheduledFor)
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                const isToday = r.scheduledFor.startsWith(today)
                return (
                  <tr key={r.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {r.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.customerName}</p>
                          {r.customerPhone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} /> {r.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users size={14} className="text-gray-400" />
                        {r.partySize}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{dateStr}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        {timeStr}
                        {isToday && <span className="text-primary font-medium"> (Today)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {r.table?.label || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.status === 'confirmed' && <CalendarDays size={10} />}
                        {r.status === 'pending' && <Clock size={10} />}
                        {r.status === 'seated' && <CheckCircle size={10} />}
                        {r.status === 'cancelled' && <XCircle size={10} />}
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: r.id, status: 'confirmed' })}
                            className="flex items-center gap-1 h-7 px-2 rounded-md border border-blue-200 text-blue-600 text-xs hover:bg-blue-50 transition-all"
                          >
                            <CheckCircle size={12} /> Confirm
                          </button>
                        )}
                        {r.status === 'confirmed' && (
                          <>
                            {/* Show table selector for seating */}
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) seatMutation.mutate({ id: r.id, tableId: e.target.value })
                              }}
                              className="h-7 rounded-md border border-emerald-200 text-emerald-600 text-xs px-1.5 bg-transparent hover:bg-emerald-50 transition-all"
                            >
                              <option value="">Seat at...</option>
                              {(tables || [])
                                .filter((t) => t.isActive && t.status !== 'occupied')
                                .map((t) => (
                                  <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <button
                              onClick={() => statusMutation.mutate({ id: r.id, status: 'cancelled' })}
                              className="flex items-center gap-1 h-7 px-2 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                              title="Cancel"
                            >
                              <XCircle size={12} />
                            </button>
                          </>
                        )}
                        {(r.status === 'pending' || r.status === 'confirmed') && (
                          <button
                            onClick={() => startEdit(r)}
                            className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-all"
                            title="Edit"
                          >
                            <Edit size={12} />
                          </button>
                        )}
                        {r.status === 'no_show' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: r.id, status: 'cancelled' })}
                            className="flex items-center gap-1 h-7 px-2 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-gray-50 transition-all"
                          >
                            Mark cancelled
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete reservation for "${r.customerName}"?`)) deleteMutation.mutate(r.id)
                          }}
                          className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 text-gray-400 text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {filteredReservations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-white">
          <CalendarDays size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {searchQuery || statusFilter ? 'No reservations match your filters' : 'No reservations yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery || statusFilter ? 'Try adjusting your search or filters.' : 'Click "New Reservation" to create one.'}
          </p>
        </div>
      )}

      {/* Weekly overview */}
      {reservations && reservations.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming This Week</h3>
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() + i)
              const dateKey = d.toISOString().slice(0, 10)
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              const dayCount = (reservations || []).filter(
                (r) => r.scheduledFor.startsWith(dateKey) && r.status !== 'cancelled' && r.status !== 'no_show',
              ).length
              const isToday = i === 0
              return (
                <div
                  key={dateKey}
                  className={`p-3 rounded-lg text-center ${
                    isToday
                      ? 'bg-primary/5 border-2 border-primary'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                    {dayNames[d.getDay()]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                    {d.getDate()}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {dayCount} booking{dayCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
