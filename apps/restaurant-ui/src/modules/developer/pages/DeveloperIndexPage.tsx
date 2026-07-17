import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Code2, Users, Shield, Settings, Package,
  FileText, BarChart3, Truck, CreditCard, Table2,
  RefreshCw, Loader2,
} from 'lucide-react'
import { getTableStats } from '../api/developer.api'
import type { TableStat } from '../api/developer.api'

const DEV_TOOLS = [
  { label: 'Users & Roles', icon: Users, to: '/staff', color: 'bg-blue-500' },
  { label: 'Permissions', icon: Shield, to: '/settings', color: 'bg-emerald-500' },
  { label: 'Items Master', icon: Package, to: '/items', color: 'bg-orange-500' },
  { label: 'Categories', icon: FileText, to: '/categories', color: 'bg-amber-500' },
  { label: 'Suppliers', icon: Truck, to: '/purchases', color: 'bg-rose-500' },
  { label: 'Reports', icon: BarChart3, to: '/reports', color: 'bg-indigo-500' },
  { label: 'Settings', icon: Settings, to: '/settings', color: 'bg-gray-600' },
  { label: 'Price Levels', icon: CreditCard, to: '/price-levels', color: 'bg-teal-500' },
]

export function DeveloperIndexPage() {
  const qc = useQueryClient()
  const { data: dbTables, isLoading } = useQuery<TableStat[]>({
    queryKey: ['dev-tables'],
    queryFn: getTableStats,
  })

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
              <Code2 size={22} className="sm:hidden" />
              <Code2 size={26} className="hidden sm:block" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Developer Portal</h1>
              <p className="text-xs sm:text-sm text-gray-400">Quick access to all system modules</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-2">
              <Table2 size={14} /> Database Tables
            </h3>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['dev-tables'] })}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-violet-400" />
            </div>
          ) : dbTables && dbTables.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dbTables.map((t: TableStat) => (
                <Link
                  key={t.tableName}
                  to="/developer/tables/$tableName"
                  params={{ tableName: t.tableName }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all"
                >
                  <Table2 size={12} className="text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{t.tableName}</p>
                    <p className="text-[10px] text-gray-400">{t.estimatedRows.toLocaleString()} rows</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-violet-600">No tables found.</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {DEV_TOOLS.map(({ label, icon: Icon, to, color }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 text-center transition-all hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-white shadow-md ${color} group-hover:scale-105 transition-transform`}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-violet-700">
            <span className="font-semibold">Developer Mode</span> — You have full system access.
            Navigate to any module using the links above or the sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}
