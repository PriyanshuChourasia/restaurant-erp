import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, UtensilsCrossed, Tag, IndianRupee, Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getItems } from '../api/items.api'

const GST_RATES = ['all', '0', '5', '12', '18', '28']

export function ItemListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gstFilter, setGstFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, search, gstFilter],
    queryFn: () => getItems({ page, limit: 20, search: search || undefined }),
  })

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title flex items-center gap-3">
            <Tag size={28} className="text-primary" />
            Items & Products
          </div>
          <div className="page-subtitle">Manage menu items with GST rates, HSN codes, and pricing.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search items..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Link to="/items/create" className="btn btn-primary">
            <Plus size={16} />
            Add Item
          </Link>
        </div>
      </div>

      {/* GST Rate Filter Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {GST_RATES.map((rate) => (
          <button
            key={rate}
            onClick={() => setGstFilter(rate)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              gstFilter === rate ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rate === 'all' ? 'All Rates' : `GST ${rate}%`}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((item) => (
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
                <span className="font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
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

              <button className="mt-3 text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
                <Eye size={14} /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(data.total / 20)}</span>
          <button disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next</button>
        </div>
      )}
    </div>
  )
}
