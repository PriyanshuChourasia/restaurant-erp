import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Loader2, Layers, ChevronDown, ChevronRight, Box, Search } from 'lucide-react'
import { getModuleSchema } from '../api/developer.api'
import type { ModuleSchema } from '../api/developer.api'

const MODULE_COLORS: Record<string, string> = {
  AuthModule: 'bg-red-500',
  UsersModule: 'bg-blue-500',
  RolesModule: 'bg-indigo-500',
  PermissionsModule: 'bg-violet-500',
  CategoryModule: 'bg-amber-500',
  ItemsModule: 'bg-orange-500',
  InventoryModule: 'bg-cyan-500',
  PurchasesModule: 'bg-emerald-500',
  SuppliersModule: 'bg-teal-500',
  SalesModule: 'bg-green-500',
  OrdersModule: 'bg-blue-600',
  KotModule: 'bg-rose-500',
  LedgerModule: 'bg-purple-500',
  VouchersModule: 'bg-fuchsia-500',
  PriceLevelsModule: 'bg-yellow-500',
  CustomersModule: 'bg-sky-500',
  OrganizationModule: 'bg-gray-600',
  SeatingModule: 'bg-pink-500',
  RecipesModule: 'bg-lime-600',
  ReservationsModule: 'bg-cyan-600',
  UnitsModule: 'bg-slate-500',
  ItemSuppliersModule: 'bg-emerald-600',
  ReportsModule: 'bg-indigo-600',
  DashboardModule: 'bg-blue-400',
  DatabaseModule: 'bg-gray-700',
}

export function DeveloperSchemaPage() {
  const [search, setSearch] = useState('')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const { data: schema, isLoading, refetch, isFetching } = useQuery<ModuleSchema[]>({
    queryKey: ['dev-schema'],
    queryFn: getModuleSchema,
  })

  const toggleModule = (mod: string) => {
    setExpandedModules((prev) => ({ ...prev, [mod]: !prev[mod] }))
  }

  const filtered = schema?.filter((s) =>
    s.module.toLowerCase().includes(search.toLowerCase()) ||
    s.entities.some((e) => e.toLowerCase().includes(search.toLowerCase())) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  ) || []

  // Count unique entities
  const allEntities = new Set<string>()
  schema?.forEach((s) => s.entities.forEach((e) => allEntities.add(e)))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Layers size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Module Schema</h1>
              <p className="text-xs text-gray-400">{schema?.length || 0} modules · {allEntities.size} entities</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules or entities..."
          className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        />
      </div>

      {/* Module List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-violet-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Layers size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No modules found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mod) => {
            const isExpanded = expandedModules[mod.module]
            const color = MODULE_COLORS[mod.module] || 'bg-gray-500'
            const uniqueEntities = [...new Set(mod.entities)]

            return (
              <div key={mod.module} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleModule(mod.module)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color} text-white`}>
                      <Box size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{mod.module}</p>
                      <p className="text-[10px] text-gray-400">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {uniqueEntities.length} entities
                    </span>
                    {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueEntities.map((entity) => (
                        <Link
                          key={entity}
                          to="/developer/tables/$tableName"
                          params={{ tableName: entity.toLowerCase() + 's' }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-violet-300 hover:text-violet-700 hover:shadow-sm transition-all"
                        >
                          <Box size={10} className="text-gray-400" />
                          {entity}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
