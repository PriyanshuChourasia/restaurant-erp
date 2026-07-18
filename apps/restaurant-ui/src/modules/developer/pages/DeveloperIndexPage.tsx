import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Code2, Database, Layers, Table2, HardDrive, BarChart3,
  RefreshCw, Loader2, Search, ChevronRight, Server,
  Users, Package, FileText, Truck,
  Settings, CreditCard, ArrowUpRight, Activity,
  LayoutGrid, List, Zap, Globe, Clock,
  ShoppingCart, CookingPot, Monitor,
} from 'lucide-react'
import { getTableStats, getModuleSchema } from '../api/developer.api'
import type { TableStat, ModuleSchema } from '../api/developer.api'

const FEATURE_TOOLS = [
  {
    category: 'Master Data',
    items: [
      { label: 'Items Master', icon: Package, to: '/items', color: 'from-orange-500 to-amber-600', desc: 'Manage products & services' },
      { label: 'Categories', icon: Layers, to: '/categories', color: 'from-amber-500 to-yellow-600', desc: 'Organize by hierarchy' },
      { label: 'Price Levels', icon: CreditCard, to: '/price-levels', color: 'from-teal-500 to-emerald-600', desc: 'Pricing tiers & overrides' },
      { label: 'Suppliers', icon: Truck, to: '/purchases', color: 'from-rose-500 to-pink-600', desc: 'Vendor management' },
    ],
  },
  {
    category: 'Operations',
    items: [
      { label: 'Orders', icon: ShoppingCart, to: '/orders', color: 'from-blue-500 to-indigo-600', desc: 'Customer orders' },
      { label: 'Reports', icon: BarChart3, to: '/reports', color: 'from-indigo-500 to-violet-600', desc: 'Analytics & insights' },
      { label: 'KOT Board', icon: CookingPot, to: '/kot', color: 'from-cyan-500 to-blue-600', desc: 'Kitchen display' },
      { label: 'POS Terminal', icon: Monitor, to: '/pos', color: 'from-emerald-500 to-teal-600', desc: 'Point of sale' },
    ],
  },
  {
    category: 'Administration',
    items: [
      { label: 'Staff & Roles', icon: Users, to: '/staff', color: 'from-blue-500 to-sky-600', desc: 'User permissions' },
      { label: 'Settings', icon: Settings, to: '/settings', color: 'from-gray-600 to-slate-700', desc: 'System configuration' },
      { label: 'Ledger', icon: Database, to: '/ledger', color: 'from-purple-500 to-violet-600', desc: 'Financial accounts' },
      { label: 'Vouchers', icon: FileText, to: '/vouchers', color: 'from-pink-500 to-rose-600', desc: 'Accounting entries' },
    ],
  },
]

function getGradientByTableName(name: string): string {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
    'from-sky-500 to-indigo-500',
    'from-fuchsia-500 to-violet-500',
    'from-lime-500 to-emerald-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function DeveloperIndexPage() {
  const qc = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: dbTables, isLoading: loadingTables } = useQuery<TableStat[]>({
    queryKey: ['dev-tables'],
    queryFn: getTableStats,
  })

  const { data: moduleSchema } = useQuery<ModuleSchema[]>({
    queryKey: ['dev-schema'],
    queryFn: getModuleSchema,
  })

  const filteredTables = useMemo(() => {
    if (!dbTables) return []
    if (!searchQuery) return dbTables
    const q = searchQuery.toLowerCase()
    return dbTables.filter((t) => t.tableName.toLowerCase().includes(q))
  }, [dbTables, searchQuery])

  const totalRows = useMemo(() => {
    if (!dbTables) return 0
    return dbTables.reduce((sum, t) => sum + t.estimatedRows, 0)
  }, [dbTables])

  const totalSize = useMemo(() => {
    if (!dbTables) return 0
    return dbTables.reduce((sum, t) => sum + t.totalSizeBytes, 0)
  }, [dbTables])

  const totalEntities = useMemo(() => {
    if (!moduleSchema) return 0
    return moduleSchema.reduce((sum, m) => sum + m.entities.length, 0)
  }, [moduleSchema])

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm text-white shadow-lg ring-1 ring-white/20">
                  <Code2 size={28} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Developer Portal</h1>
                  <p className="text-sm text-violet-200/80 mt-1">System administration & database management console</p>
                </div>
              </div>
              <button
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ['dev-tables'] })
                  qc.invalidateQueries({ queryKey: ['dev-schema'] })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-all ring-1 ring-white/20"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Database Tables', value: dbTables?.length ?? '—', icon: Table2, color: 'from-cyan-400 to-blue-500' },
                { label: 'Total Rows', value: totalRows.toLocaleString(), icon: Database, color: 'from-emerald-400 to-teal-500' },
                { label: 'Total Size', value: formatBytes(totalSize), icon: HardDrive, color: 'from-amber-400 to-orange-500' },
                { label: 'Schema Entities', value: totalEntities.toLocaleString(), icon: Layers, color: 'from-pink-400 to-rose-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 p-3.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                    <stat.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-violet-200/70">{stat.label}</p>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Links ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20">
              <Zap size={15} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Quick Access</h2>
              <p className="text-xs text-gray-400">Jump to any module</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURE_TOOLS.map((group) => (
              <div key={group.category} className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1">{group.category}</h3>
                <div className="space-y-2">
                  {group.items.map(({ label, icon: Icon, to, color, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-200/50"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">{label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{desc}</p>
                      </div>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-violet-500 translate-x-0 group-hover:translate-x-0.5 -translate-y-0 group-hover:-translate-y-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Database Tables ──────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <Server size={15} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Database Tables</h2>
                <p className="text-xs text-gray-400">{dbTables?.length ?? 0} tables · {totalRows.toLocaleString()} rows · {formatBytes(totalSize)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />                  <input
                  type="text"
                  placeholder="Search tables..."
                  aria-label="Search database tables"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 sm:w-48 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                />
              </div>
              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {loadingTables ? (
            <div className="flex items-center justify-center py-12 rounded-2xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading tables...</span>
              </div>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
              <Search size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No tables match "{searchQuery}"</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredTables.map((t) => (
                <Link
                  key={t.tableName}
                  to="/developer/tables/$tableName"
                  params={{ tableName: t.tableName }}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-200/50"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${getGradientByTableName(t.tableName)}`} />
                  <div className="flex items-start justify-between mb-3 mt-0.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getGradientByTableName(t.tableName)} text-white shadow-sm`}>
                      <Table2 size={14} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <HardDrive size={10} />
                      {formatBytes(t.totalSizeBytes)}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-gray-900 transition-colors">{t.tableName}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-gray-400">{t.estimatedRows.toLocaleString()} rows</span>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredTables.map((t) => (
                  <Link
                    key={t.tableName}
                    to="/developer/tables/$tableName"
                    params={{ tableName: t.tableName }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getGradientByTableName(t.tableName)} text-white shadow-sm`}>
                      <Table2 size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{t.tableName}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="hidden sm:inline">{formatBytes(t.totalSizeBytes)}</span>
                      <span>{t.estimatedRows.toLocaleString()} rows</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Module Schema Overview ────────────────────────────── */}
        {moduleSchema && moduleSchema.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <Layers size={15} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Module Schema Overview</h2>
                <p className="text-xs text-gray-400">{moduleSchema.length} modules · {totalEntities} entities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {moduleSchema.map((mod) => (
                <Link
                  key={mod.module}
                  to="/developer/schema"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-100 group-hover:border-indigo-200 transition-colors">
                    <Layers size={16} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize group-hover:text-gray-900 transition-colors">{mod.module}</p>
                    <p className="text-xs text-gray-400 truncate">{mod.entities.length} entity{mod.entities.length !== 1 ? 'ies' : 'y'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{mod.entities.length}</span>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-indigo-500 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── System Footer ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 sm:p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/30 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shrink-0">
              <Activity size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Developer Mode Active</p>
              <p className="text-xs text-gray-400 mt-0.5">
                You have full system access. Use caution when modifying data directly in database tables.
                All changes are logged and audited.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
              <Globe size={12} className="text-emerald-500" />
              <span>API Connected</span>
              <span className="text-gray-300">·</span>
              <Clock size={12} />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
