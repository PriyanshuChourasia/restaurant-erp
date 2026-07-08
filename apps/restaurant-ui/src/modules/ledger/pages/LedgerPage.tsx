import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, IndianRupee, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

export function LedgerPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  const { data: balanceSheet } = useQuery({
    queryKey: ['ledger-balance'],
    queryFn: () => apiClient.get('/ledger/balance-sheet').then(r => r.data),
  })

  const { data: accounts } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: () => apiClient.get('/ledger/accounts').then(r => r.data),
  })

  const { data: entries } = useQuery({
    queryKey: ['ledger-entries', selectedAccount],
    queryFn: () => selectedAccount ? apiClient.get(`/ledger/accounts/${selectedAccount}/entries`).then(r => r.data) : Promise.resolve(null),
    enabled: !!selectedAccount,
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title flex items-center gap-3">
            <BookOpen size={28} className="text-primary" />
            Financial Ledger
          </div>
          <div className="page-subtitle">Manage accounts, opening balances, and transactions.</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      {balanceSheet && (
        <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon success"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Credits</div>
              <div className="stat-value text-green-600">₹{Number(balanceSheet.totalCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><TrendingDown size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Debits</div>
              <div className="stat-value text-red-600">₹{Number(balanceSheet.totalDebits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary"><IndianRupee size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Net Balance</div>
              <div className="stat-value">₹{Number(balanceSheet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts List */}
        <div className="section-card">
          <div className="card-header">
            <div className="card-title">Accounts</div>
          </div>
          <div className="card-body p-0">
            {(accounts || []).map((acc: any) => (
              <button key={acc.id} onClick={() => setSelectedAccount(acc.id)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${selectedAccount === acc.id ? 'bg-primary/5' : ''}`}>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-400">Op. Balance: ₹{Number(acc.openingBalance).toFixed(2)}</p>
                </div>
                <span className={`text-sm font-bold ${acc.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Number(acc.currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </button>
            ))}
            {(!accounts || accounts.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">No accounts created yet. Add one to get started.</div>
            )}
          </div>
        </div>

        {/* Entries */}
        <div className="section-card">
          <div className="card-header">
            <div className="card-title">Recent Entries</div>
          </div>
          <div className="card-body p-0">
            {!selectedAccount ? (
              <div className="text-center py-8 text-gray-400 text-sm">Select an account to view entries</div>
            ) : entries?.data?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No entries for this account</div>
            ) : (
              entries?.data?.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {entry.type === 'credit' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{entry.category}</p>
                      <p className="text-xs text-gray-400">{entry.description || entry.reference || '-'}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'credit' ? '+' : '-'}₹{Number(entry.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
