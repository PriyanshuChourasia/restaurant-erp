import { BarChart3, TrendingUp, DollarSign, Users, UtensilsCrossed, Download } from 'lucide-react'
import '../../../styles/global.css'

const reports = [
  { name: 'Daily Sales Report', desc: 'Complete daily revenue, orders, and averages breakdown.', icon: DollarSign, color: 'success' as const, date: 'Today' },
  { name: 'Popular Items', desc: 'Most ordered menu items, revenue contribution, and trends.', icon: UtensilsCrossed, color: 'primary' as const, date: 'This Week' },
  { name: 'Labor Cost Analysis', desc: 'Staff hours, labor cost percentage, and scheduling efficiency.', icon: Users, color: 'info' as const, date: 'This Month' },
  { name: 'Peak Hours Report', desc: 'Busiest times, table turnover rates, and staffing needs.', icon: TrendingUp, color: 'warning' as const, date: 'This Week' },
]

export function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">View insights, trends, and performance metrics.</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export All
          </button>
          <button className="btn btn-primary">
            <BarChart3 size={16} />
            Custom Report
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="stats-grid">
        {[
          { label: 'Total Revenue (MTD)', value: '$84,320', change: '+15.3% vs last month', color: 'success', icon: DollarSign },
          { label: 'Avg Daily Sales', value: '$3,840', change: '+8.7% vs last month', color: 'primary', icon: TrendingUp },
          { label: 'Total Orders (MTD)', value: '2,456', change: '+12.1% vs last month', color: 'info', icon: BarChart3 },
          { label: 'Avg Order Value', value: '$34.33', change: '+2.1% vs last month', color: 'warning', icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon ${stat.color}`}><stat.icon size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change up">{stat.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report List */}
      <div className="module-grid">
        {reports.map((report) => (
          <div key={report.name} className="module-card">
            <div className={`module-card-icon ${report.color}`}>
              <report.icon size={22} />
            </div>
            <div className="module-card-title">{report.name}</div>
            <div className="module-card-desc" style={{ marginBottom: 12 }}>{report.desc}</div>
            <div className="module-card-status" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>{report.date}</span>
              <button className="btn btn-primary btn-sm">View Report</button>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="section-card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Revenue Trend (Last 7 Days)</div>
          <select className="filter-select" defaultValue="week">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, paddingTop: 24 }}>
            {[65, 78, 52, 91, 85, 72, 88].map((val, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>${(val * 48).toLocaleString()}</span>
                <div style={{
                  width: '100%',
                  height: `${val}px`,
                  background: idx === 3 ? 'var(--color-primary)' : 'var(--color-primary-light)',
                  borderRadius: '6px 6px 0 0',
                  opacity: idx === 3 ? 1 : 0.6,
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer',
                }} />
                <span style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
