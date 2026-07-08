import { Plus, Search, ShoppingCart, Filter } from 'lucide-react'
import '../../../styles/global.css'

const orders = [
  { id: '#1042', table: 'Table 7', server: 'Mike', items: 3, total: 52.00, status: 'In Progress', time: '2 min ago', payment: 'Card' },
  { id: '#1041', table: 'Table 12', server: 'Sarah', items: 5, total: 78.50, status: 'New', time: '5 min ago', payment: 'Cash' },
  { id: '#1040', table: 'Table 3', server: 'Mike', items: 2, total: 34.00, status: 'Completed', time: '12 min ago', payment: 'Card' },
  { id: '#1039', table: 'Table 8', server: 'Emma', items: 4, total: 67.25, status: 'Completed', time: '18 min ago', payment: 'Card' },
  { id: '#1038', table: 'Table 5', server: 'Sarah', items: 1, total: 18.00, status: 'In Progress', time: '22 min ago', payment: 'Cash' },
  { id: '#1037', table: 'Table 10', server: 'Emma', items: 6, total: 95.00, status: 'Completed', time: '35 min ago', payment: 'Card' },
  { id: '#1036', table: 'Table 2', server: 'Mike', items: 2, total: 28.50, status: 'Cancelled', time: '45 min ago', payment: '-' },
  { id: '#1035', table: 'Table 15', server: 'Sarah', items: 3, total: 44.00, status: 'New', time: '48 min ago', payment: 'Cash' },
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'New': 'badge-info',
    'In Progress': 'badge-warning',
    'Completed': 'badge-success',
    'Cancelled': 'badge-error',
  }
  return `badge ${map[status] || 'badge-gray'}`
}

export function OrdersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">Track and manage all incoming orders.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--color-gray-400)' }} />
            <input type="text" placeholder="Search orders..." />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'New Orders', value: '3', icon: ShoppingCart, color: 'info', change: '+2 from last hour' },
          { label: 'In Progress', value: '5', icon: ShoppingCart, color: 'warning', change: 'Being prepared' },
          { label: 'Ready', value: '2', icon: ShoppingCart, color: 'success', change: 'Awaiting pickup' },
          { label: 'Today Total', value: '$1,284', icon: ShoppingCart, color: 'primary', change: '32 orders' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card" style={{ padding: '16px' }}>
            <div className={`stat-icon ${stat.color}`} style={{ width: 40, height: 40 }}>
              <stat.icon size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{stat.value}</div>
              <div className="activity-time">{stat.change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Server</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.id}</td>
                  <td>{order.table}</td>
                  <td>{order.server}</td>
                  <td>{order.items} items</td>
                  <td style={{ fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                  <td><span className={statusBadge(order.status)}>{order.status}</span></td>
                  <td style={{ fontSize: 13 }}>{order.payment}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>{order.time}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
