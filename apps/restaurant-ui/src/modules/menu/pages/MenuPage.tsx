import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, UtensilsCrossed, IndianRupee, Eye } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getItems } from '@/modules/items/api/items.api'

const GST_RATES = ['all', '0', '5', '12', '18', '28']

export function MenuPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gstFilter, setGstFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['menu-items', page, search],
    queryFn: () => getItems({ page, limit: 20, search: search || undefined }),
  })

  const items = itemsData?.items || []
  const categories = [...new Set(items.map((i: any) => i.categoryName).filter(Boolean))] as string[]

  const filteredItems = items.filter((item: any) => {
    if (gstFilter !== 'all' && String(item.gstRate) !== gstFilter) return false
    if (categoryFilter !== 'all' && item.categoryName !== categoryFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage menu items with GST rates, HSN codes, and pricing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <Link to="/items/create" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90">
            <Plus size={15} />
            Add Item
          </Link>
        </div>
      </div>

      {/* Category & GST Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              categoryFilter === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {GST_RATES.map((rate) => (
          <button
            key={rate}
            onClick={() => setGstFilter(rate)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              gstFilter === rate ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rate === 'all' ? 'All GST' : `GST ${rate}%`}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <UtensilsCrossed size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-600">No menu items found</p>
          <p className="text-sm">{search ? 'Try a different search term.' : 'Add your first menu item to get started.'}</p>
          <Link to="/items/create" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white">
            <Plus size={15} />
            Add Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.isVeg ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {item.isVeg ? 'Veg' : 'Non-Veg'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mb-2">
                <IndianRupee size={14} className="text-gray-400" />
                <span className="font-bold text-gray-900">₹{item.price?.toFixed(2)}</span>
                <span className="text-xs text-gray-400 ml-1">(incl. GST)</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{item.hsnCode}</span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">GST {item.gstRate}%</span>
                {item.categoryName && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.categoryName}</span>
                )}
              </div>

              {!item.isActive && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Inactive</div>
              )}

              <Link
                to="/items"
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
              >
                <Eye size={14} /> View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {itemsData && itemsData.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 font-medium text-gray-600"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(itemsData.total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(itemsData.total / 20)}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 font-medium text-gray-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
