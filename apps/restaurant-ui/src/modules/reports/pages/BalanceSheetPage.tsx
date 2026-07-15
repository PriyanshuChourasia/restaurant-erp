import { BarChart3, TrendingUp, TrendingDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useBalanceSheet } from '../hooks/useReportQueries'
import { ReportPageHeader, ReportCard, LoadingSkeleton, EmptyState, formatCurrency, SectionHeader, StatusBadge } from '../components/ReportComponents'

export function BalanceSheetPage() {
  const { data, isLoading } = useBalanceSheet()
  const [search, setSearch] = useState('')

  const filteredAccounts = data?.accounts?.filter((a) =>
    search === '' ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const credits = filteredAccounts.filter(a => a.currentBalance > 0)
  const debits = filteredAccounts.filter(a => a.currentBalance < 0)
  const totalCreditBalance = credits.reduce((s, a) => s + a.currentBalance, 0)
  const totalDebitBalance = debits.reduce((s, a) => s + Math.abs(a.currentBalance), 0)

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Balance Sheet"
        description="Account balances and financial position"
        icon={BarChart3}
        iconColor="bg-cyan-600"
        badge={data?.accounts?.length ? { label: `${data.accounts.length} accounts`, color: 'bg-cyan-100 text-cyan-700' } : undefined}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Total Credits</span>
          </div>
          <p className="text-xl font-bold text-emerald-900">{formatCurrency(data?.totalCredits || 0)}</p>
          <p className="text-xs text-emerald-600 mt-1">{credits.length} credit accounts</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Total Debits</span>
          </div>
          <p className="text-xl font-bold text-red-900">{formatCurrency(data?.totalDebits || 0)}</p>
          <p className="text-xs text-red-600 mt-1">{debits.length} debit accounts</p>
        </div>
        <div className={`rounded-xl border p-5 ${(data?.netBalance || 0) >= 0 ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'}`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className={`${(data?.netBalance || 0) >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
            <span className="text-sm font-medium text-gray-700">Net Balance</span>
          </div>
          <p className={`text-xl font-bold ${(data?.netBalance || 0) >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
            {formatCurrency(data?.netBalance || 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Credits - Debits</p>
        </div>
      </div>

      {/* Net Balance Visual */}
      {data && data.totalCredits > 0 && data.totalDebits > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Balance Overview" subtitle="Credits vs Debits visualization" />
          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(data.totalCredits / (data.totalCredits + data.totalDebits)) * 100}%` }}
              title={`Credits: ${formatCurrency(data.totalCredits)}`}
            />
            <div
              className="bg-red-400 h-full transition-all"
              style={{ width: `${(data.totalDebits / (data.totalCredits + data.totalDebits)) * 100}%` }}
              title={`Debits: ${formatCurrency(data.totalDebits)}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-gray-600">Credits ({((data.totalCredits / (data.totalCredits + data.totalDebits)) * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-400" />
              <span className="text-gray-600">Debits ({((data.totalDebits / (data.totalCredits + data.totalDebits)) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Accounts */}
        <ReportCard title="Credit Balances" subtitle={`${credits.length} accounts`} className="border-emerald-200">
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : credits.length > 0 ? (
            <div className="space-y-2">
              {credits
                .sort((a, b) => b.currentBalance - a.currentBalance)
                .map((account) => {
                  const pct = totalCreditBalance > 0 ? (account.currentBalance / totalCreditBalance) * 100 : 0
                  return (
                    <div key={account.id} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{account.name}</span>
                          {account.description && (
                            <span className="text-xs text-gray-400 ml-2">{account.description}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-emerald-700">{formatCurrency(account.currentBalance)}</span>
                      </div>
                      <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>Opening: {formatCurrency(account.openingBalance)}</span>
                        <span>Credits: {formatCurrency(account.totalCredits)} · Debits: {formatCurrency(account.totalDebits)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No credit accounts" description="No accounts with credit balances found" />
          )}
        </ReportCard>

        {/* Debit Accounts */}
        <ReportCard title="Debit Balances" subtitle={`${debits.length} accounts`} className="border-red-200">
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : debits.length > 0 ? (
            <div className="space-y-2">
              {debits
                .sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))
                .map((account) => {
                  const pct = totalDebitBalance > 0 ? (Math.abs(account.currentBalance) / totalDebitBalance) * 100 : 0
                  return (
                    <div key={account.id} className="p-3 rounded-lg bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{account.name}</span>
                          {account.description && (
                            <span className="text-xs text-gray-400 ml-2">{account.description}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-red-700">{formatCurrency(Math.abs(account.currentBalance))}</span>
                      </div>
                      <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>Opening: {formatCurrency(Math.abs(account.openingBalance))}</span>
                        <span>Credits: {formatCurrency(account.totalCredits)} · Debits: {formatCurrency(account.totalDebits)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <EmptyState icon={TrendingDown} title="No debit accounts" description="No accounts with debit balances found" />
          )}
        </ReportCard>
      </div>

      {/* All Accounts Table */}
      {filteredAccounts.length > 0 && (
        <ReportCard title="All Accounts" subtitle={`${filteredAccounts.length} accounts${search ? ' (filtered)' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Opening</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Debits</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts
                  .sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))
                  .map((account) => (
                    <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{account.name}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{account.description || '-'}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(account.openingBalance)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(account.totalCredits)}</td>
                      <td className="py-3 px-4 text-right text-red-600 font-medium">{formatCurrency(account.totalDebits)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${account.currentBalance >= 0 ? 'text-gray-900' : 'text-red-700'}`}>
                          {formatCurrency(account.currentBalance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={account.currentBalance >= 0 ? 'Credit' : 'Debit'}
                          variant={account.currentBalance >= 0 ? 'success' : 'danger'}
                        />
                      </td>
                    </tr>
                  ))}
                <tr className="font-semibold bg-gray-50 border-t-2 border-gray-200">
                  <td className="py-3 px-4 text-gray-900" colSpan={2}>Net Balance</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(data?.netBalance || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(data?.totalCredits || 0)}</td>
                  <td className="py-3 px-4 text-right text-red-700">{formatCurrency(data?.totalDebits || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(data?.netBalance || 0)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  )
}
