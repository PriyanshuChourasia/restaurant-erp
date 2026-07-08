import { Plus, Search, Package, Filter, AlertTriangle } from 'lucide-react'
import '../../../styles/global.css'

const inventory = [
  { name: 'Tomato Sauce', category: 'Sauces', stock: 2, unit: 'cases', minLevel: 5, status: 'Critical' as const },
  { name: 'Mozzarella', category: 'Dairy', stock: 4, unit: 'kg', minLevel: 8, status: 'Low' as const },
  { name: 'Olive Oil', category: 'Oils', stock: 3, unit: 'bottles', minLevel: 6, status: 'Low' as const },
  { name: 'Basil', category: 'Herbs', stock: 12, unit: 'bunches', minLevel: 5, status: 'Ok' as const },
  { name: 'Pasta Flour', category: 'Dry Goods', stock: 15, unit: 'kg', minLevel: 10, status: 'Ok' as const },
  { name: 'Parmesan', category: 'Dairy', stock: 6, unit: 'kg', minLevel: 4, status: 'Ok' as const },
  { name: 'Pancetta', category: 'Meat', stock: 3, unit: 'kg', minLevel: 3, status: 'Low' as const },
  { name: 'Salmon', category: 'Seafood', stock: 5, unit: 'fillets', minLevel: 8, status: 'Low' as const },
  { name: 'Arborio Rice', category: 'Dry Goods', stock: 8, unit: 'kg', minLevel: 5, status: 'Ok' as const },
  { name: 'Heavy Cream', category: 'Dairy', stock: 4, unit: 'liters', minLevel: 6, status: 'Low' as const },
]

function stockBadge(status: string) {
  const map: Record<string, string> = {
    'Critical': 'badge-error',
    'Low': 'badge-warning',
    'Ok': 'badge-success',
  }
  return `badge ${map[status] || 'badge-gray'}`
}

export function InventoryPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">Track stock levels, manage supplies, and receive deliveries.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--color-gray-400)' }} />
            <input type="text" placeholder="Search inventory..." />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-icon info" style={{ width: 40, height: 40 }}><Package size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Items</div>
            <div className="stat-value" style={{ fontSize: 22 }}>48</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid var(--color-error)' }}>
          <div className="stat-icon" style={{ width: 40, height: 40, background: 'var(--color-error-bg)', color: 'var(--color-error)' }}><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Critical Stock</div>
            <div className="stat-value" style={{ fontSize: 22, color: 'var(--color-error)' }}>1</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid var(--color-warning)' }}>
          <div className="stat-icon" style={{ width: 40, height: 40, background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value" style={{ fontSize: 22, color: 'var(--color-warning)' }}>5</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-icon success" style={{ width: 40, height: 40 }}><Package size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">In Stock</div>
            <div className="stat-value" style={{ fontSize: 22 }}>42</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min Level</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.name}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.stock} {item.unit}</td>
                  <td>{item.minLevel} {item.unit}</td>
                  <td><span className={stockBadge(item.status)}>{item.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-primary btn-sm">Order</button>
                    </div>
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
