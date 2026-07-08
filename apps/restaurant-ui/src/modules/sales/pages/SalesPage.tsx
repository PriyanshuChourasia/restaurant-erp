import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Receipt, IndianRupee } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

export function SalesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => apiClient.get('/sales', { params: { page, limit: 20, search: search || undefined } }).then(r => r.data),
  })

  const { data: daily } = useQuery({
    queryKey: ['sales-daily'],
    queryFn: () => apiClient.get('/sales/daily').then(r => r.data),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title flex items-center gap-3">
            <Receipt size={28} className="text-primary" />
            Sales & Invoices
          </div>
          <div className="page-subtitle">View all sales transactions with GST breakdown.</div>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      {daily && (
        <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon success"><IndianRupee size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Today's Sales</div>
              <div className="stat-value">₹{daily.totalSales?.toFixed(2) || '0.00'}</div>
              <div className="activity-time">{daily.orderCount || 0} orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><IndianRupee size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Today's Tax (GST)</div>
              <div className="stat-value">₹{daily.totalTax?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Receipt size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Avg Order Value</div>
              <div className="stat-value">₹{daily.orderCount > 0 ? (daily.totalSales / daily.orderCount).toFixed(2) : '0.00'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="section-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Table</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">No sales yet</td></tr>
              ) : (
                data?.data?.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-semibold">{inv.invoiceNumber}</td>
                    <td>{inv.customerName || 'Walk-in'}</td>
                    <td>{inv.tableNumber || '-'}</td>
                    <td>{inv.items?.length || 0}</td>
                    <td>₹{Number(inv.subtotal).toFixed(2)}</td>
                    <td>₹{Number(inv.taxTotal).toFixed(2)}</td>
                    <td className="font-bold">₹{Number(inv.grandTotal).toFixed(2)}</td>
                    <td><span className="uppercase text-xs">{inv.paymentMethod}</span></td>
                    <td>
                      <span className={`badge ${inv.status === 'completed' ? 'badge-success' : inv.status === 'cancelled' ? 'badge-error' : 'badge-info'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-sm text-gray-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
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
