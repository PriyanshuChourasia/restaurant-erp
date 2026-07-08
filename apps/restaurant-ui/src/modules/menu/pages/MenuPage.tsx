import { Plus, Search, UtensilsCrossed, Filter } from 'lucide-react'
import '../../../styles/global.css'

export function MenuPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Menu Management</div>
          <div className="page-subtitle">Manage your restaurant's menu items, categories, and pricing.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--color-gray-400)' }} />
            <input type="text" placeholder="Search menu items..." />
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

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['All Items', 'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials'].map((cat) => (
          <button
            key={cat}
            className="btn"
            style={{
              background: cat === 'All Items' ? 'var(--color-primary)' : 'white',
              color: cat === 'All Items' ? 'white' : 'var(--color-gray-600)',
              border: cat === 'All Items' ? 'none' : '1px solid var(--color-gray-300)',
              borderRadius: '100px',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="module-grid">
        {[
          { name: 'Margherita Pizza', desc: 'San Marzano tomatoes, fresh mozzarella, basil', price: '$16.00', status: 'Active', category: 'Main Course' },
          { name: 'Caesar Salad', desc: 'Romaine, parmesan, croutons, house dressing', price: '$12.00', status: 'Active', category: 'Appetizers' },
          { name: 'Spaghetti Carbonara', desc: 'Pancetta, egg yolk, pecorino, black pepper', price: '$18.00', status: 'Active', category: 'Main Course' },
          { name: 'Tiramisu', desc: 'Espresso-soaked ladyfingers, mascarpone cream', price: '$9.00', status: 'Active', category: 'Desserts' },
          { name: 'Grilled Salmon', desc: 'Atlantic salmon, lemon butter sauce, seasonal veg', price: '$24.00', status: 'Active', category: 'Main Course' },
          { name: 'Bruschetta', desc: 'Toasted bread, tomato, garlic, basil, olive oil', price: '$8.00', status: 'Active', category: 'Appetizers' },
          { name: 'Espresso', desc: 'Double shot espresso, served with biscotti', price: '$4.00', status: 'Active', category: 'Beverages' },
          { name: 'Panna Cotta', desc: 'Vanilla panna cotta, berry compote', price: '$8.00', status: 'Inactive', category: 'Desserts' },
        ].map((item) => (
          <div key={item.name} className="module-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="module-card-icon primary">
                <UtensilsCrossed size={22} />
              </div>
              <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-gray'}`}>
                {item.status}
              </span>
            </div>
            <div className="module-card-title">{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginBottom: 4 }}>{item.category}</div>
            <div className="module-card-desc">{item.desc}</div>
            <div className="module-card-status" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-gray-900)' }}>{item.price}</span>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
