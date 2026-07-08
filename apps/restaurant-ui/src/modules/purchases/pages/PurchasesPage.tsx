import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ClipboardList, Plus } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

export function PurchasesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search, statusFilter],
    queryFn: () => apiClient.get('/purchases', { params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined } }).then(r => r.data),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title flex items-center gap-3">
            <ClipboardList size={28} className="text-primary" />
            Purchase Orders
          </div>
          <div className="page-subtitle">Track purchases from suppliers.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> New Purchase
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'ordered', 'received', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="section-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No purchases yet</td></tr>
              ) : (
                data?.data?.map((po: any) => (
                  <tr key={po.id}>
                    <td className="font-semibold">{po.purchaseNumber}</td>
                    <td>{po.supplier?.name || '-'}</td>
                    <td>{po.items?.length || 0}</td>
                    <td>₹{Number(po.subtotal).toFixed(2)}</td>
                    <td>₹{Number(po.taxAmount).toFixed(2)}</td>
                    <td className="font-bold">₹{Number(po.totalAmount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${po.status === 'received' ? 'badge-success' : po.status === 'cancelled' ? 'badge-error' : 'badge-info'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="text-sm text-gray-400">{new Date(po.purchaseDate).toLocaleDateString('en-IN')}</td>
                    <td><button className="btn btn-ghost btn-sm">View</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
