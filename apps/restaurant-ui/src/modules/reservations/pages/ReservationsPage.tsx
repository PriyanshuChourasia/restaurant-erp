import { Plus, Search, CalendarDays, Filter, Clock } from 'lucide-react'
import '../../../styles/global.css'

const reservations = [
  { name: 'Johnson Family', guests: 4, date: 'Today', time: '7:00 PM', table: 'Table 5', status: 'Confirmed' as const, phone: '(555) 123-4567' },
  { name: 'Smith Party', guests: 6, date: 'Today', time: '7:30 PM', table: 'Table 8', status: 'Confirmed' as const, phone: '(555) 234-5678' },
  { name: 'Williams', guests: 2, date: 'Today', time: '8:00 PM', table: 'Table 3', status: 'Confirmed' as const, phone: '(555) 345-6789' },
  { name: 'Brown Group', guests: 8, date: 'Today', time: '6:30 PM', table: 'Table 12', status: 'Seated' as const, phone: '(555) 456-7890' },
  { name: 'Davis', guests: 3, date: 'Today', time: '8:30 PM', table: 'Table 6', status: 'Pending' as const, phone: '(555) 567-8901' },
  { name: 'Garcia Family', guests: 5, date: 'Tomorrow', time: '7:00 PM', table: 'Table 10', status: 'Confirmed' as const, phone: '(555) 678-9012' },
  { name: 'Martinez', guests: 2, date: 'Tomorrow', time: '6:00 PM', table: 'Table 2', status: 'Pending' as const, phone: '(555) 789-0123' },
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Confirmed': 'badge-info',
    'Seated': 'badge-success',
    'Pending': 'badge-warning',
    'Cancelled': 'badge-error',
  }
  return `badge ${map[status] || 'badge-gray'}`
}

export function ReservationsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reservations</div>
          <div className="page-subtitle">Manage table bookings and reservation requests.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--color-gray-400)' }} />
            <input type="text" placeholder="Search reservations..." />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Reservation
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: "Today's Reservations", value: '12', icon: CalendarDays, color: 'primary' },
          { label: 'Guests Expected', value: '42', icon: CalendarDays, color: 'info' },
          { label: 'Tables Available', value: '8', icon: CalendarDays, color: 'success' },
          { label: 'Pending Requests', value: '3', icon: Clock, color: 'warning' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card" style={{ padding: '16px' }}>
            <div className={`stat-icon ${stat.color}`} style={{ width: 40, height: 40 }}>
              <stat.icon size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Party Size</th>
                <th>Date</th>
                <th>Time</th>
                <th>Table</th>
                <th>Status</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={`${r.name}-${r.time}`}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.guests} guests</td>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                  <td>{r.table}</td>
                  <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td style={{ fontSize: 13 }}>{r.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-primary btn-sm">Manage</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar placeholder */}
      <div className="section-card">
        <div className="card-header">
          <div className="card-title">Weekly Overview</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={day} style={{
                padding: 16,
                background: idx === 3 ? 'var(--color-primary-bg)' : 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                border: idx === 3 ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-200)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: idx === 3 ? 'var(--color-primary)' : 'var(--color-gray-500)', marginBottom: 4 }}>{day}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: idx === 3 ? 'var(--color-primary)' : 'var(--color-gray-900)' }}>{8 + idx}</div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>
                  {[8, 6, 10, 12, 14, 18, 15][idx]} reservations
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
