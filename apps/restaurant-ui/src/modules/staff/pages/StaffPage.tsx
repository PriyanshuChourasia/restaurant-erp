import { Plus, Search, Filter } from 'lucide-react'
import '../../../styles/global.css'

const staff = [
  { name: 'Emma Wilson', role: 'Head Chef', department: 'Kitchen', shift: 'Morning', status: 'Active', email: 'emma@restaurant.com', initials: 'EW' },
  { name: 'James Chen', role: 'Sous Chef', department: 'Kitchen', shift: 'Evening', status: 'Active', email: 'james@restaurant.com', initials: 'JC' },
  { name: 'Sarah Johnson', role: 'Server', department: 'Service', shift: 'Morning', status: 'Active', email: 'sarah@restaurant.com', initials: 'SJ' },
  { name: 'Mike Torres', role: 'Server', department: 'Service', shift: 'Evening', status: 'Active', email: 'mike@restaurant.com', initials: 'MT' },
  { name: 'Lisa Park', role: 'Hostess', department: 'Front Desk', shift: 'Morning', status: 'Active', email: 'lisa@restaurant.com', initials: 'LP' },
  { name: 'David Kim', role: 'Bartender', department: 'Bar', shift: 'Evening', status: 'Active', email: 'david@restaurant.com', initials: 'DK' },
  { name: 'Ana Garcia', role: 'Line Cook', department: 'Kitchen', shift: 'Morning', status: 'Active', email: 'ana@restaurant.com', initials: 'AG' },
  { name: 'Tom Brown', role: 'Dishwasher', department: 'Kitchen', shift: 'Evening', status: 'On Leave', email: 'tom@restaurant.com', initials: 'TB' },
  { name: 'Rachel Green', role: 'Server', department: 'Service', shift: 'Morning', status: 'Active', email: 'rachel@restaurant.com', initials: 'RG' },
  { name: 'Alex Rivera', role: 'Manager', department: 'Management', shift: 'Morning', status: 'Active', email: 'alex@restaurant.com', initials: 'AR' },
]

export function StaffPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Staff</div>
          <div className="page-subtitle">Manage employees, schedules, and roles.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--color-gray-400)' }} />
            <input type="text" placeholder="Search staff..." />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Department quick links */}
      <div className="filters-bar">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)' }}>Department:</span>
        {['All', 'Kitchen', 'Service', 'Front Desk', 'Bar', 'Management'].map((dept) => (
          <button
            key={dept}
            className="btn"
            style={{
              padding: '4px 12px',
              fontSize: 13,
              background: dept === 'All' ? 'var(--color-primary)' : 'transparent',
              color: dept === 'All' ? 'white' : 'var(--color-gray-600)',
              borderRadius: '100px',
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="module-grid">
        {staff.map((member) => (
          <div key={member.name} className="module-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div className="sidebar-user-avatar" style={{ width: 44, height: 44, fontSize: 15, flexShrink: 0 }}>
                {member.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="module-card-title" style={{ fontSize: 15, marginBottom: 0 }}>{member.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>{member.role}</div>
              </div>
              <span className={`badge ${member.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                {member.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--color-gray-500)' }}>
              <span>{member.department}</span>
              <span>|</span>
              <span>{member.shift} Shift</span>
            </div>
            <div className="module-card-status" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>{member.email}</span>
              <button className="btn btn-ghost btn-sm">Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
