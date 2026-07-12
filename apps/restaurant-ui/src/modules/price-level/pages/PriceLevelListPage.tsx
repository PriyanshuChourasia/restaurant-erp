import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Tag, Search, Check, MoreHorizontal, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { usePriceLevels, useActivatePriceLevel, useDeactivatePriceLevel, useDeletePriceLevel, useSetDefaultPriceLevel } from '../hooks/usePriceLevelQueries'
import type { PriceLevel, PriceLevelListParams } from '../types/price-level.types'

export function PriceLevelListPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<PriceLevelListParams>({ page: 1, limit: 20 })
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PriceLevel | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = usePriceLevels(params)
  const activateMutation = useActivatePriceLevel()
  const deactivateMutation = useDeactivatePriceLevel()
  const deleteMutation = useDeletePriceLevel()
  const setDefaultMutation = useSetDefaultPriceLevel()

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))
    },
    [],
  )

  const handleEdit = useCallback(
    (id: string) => navigate({ to: `/price-levels/${id}/edit` }),
    [navigate],
  )

  const handlePricing = useCallback(
    (id: string) => navigate({ to: `/price-levels/${id}/pricing` }),
    [navigate],
  )

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-600 font-medium">Failed to load price levels</p>
        <button onClick={() => refetch()} className="mt-2 text-sm text-primary hover:underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Levels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage pricing tiers for different customer segments.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: '/price-levels/create' })}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90"
        >
          <Plus size={15} />
          Create Price Level
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search price levels..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Code
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Default
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((pl) => (
                <tr key={pl.id} className="transition-colors hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <Tag size={15} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{pl.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                      {pl.code}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {pl.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {pl.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pl.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <Check size={11} />
                        Default
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === pl.id ? null : pl.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {menuOpen === pl.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-4 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                          <button
                            onClick={() => { setMenuOpen(null); handleEdit(pl.id) }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => { setMenuOpen(null); handlePricing(pl.id) }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Tag size={14} />
                            Manage Pricing
                          </button>
                          {!pl.isDefault && (
                            <button
                              onClick={() => { setMenuOpen(null); setDefaultMutation.mutate(pl.id) }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Check size={14} />
                              Set as Default
                            </button>
                          )}
                          {pl.isActive ? (
                            <button
                              onClick={() => { setMenuOpen(null); deactivateMutation.mutate(pl.id) }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
                            >
                              <PowerOff size={14} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => { setMenuOpen(null); activateMutation.mutate(pl.id) }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                            >
                              <Power size={14} />
                              Activate
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => { setMenuOpen(null); setDeleteTarget(pl) }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Tag size={40} className="text-gray-200" />
                    <p className="text-sm text-gray-400">
                      {params.search
                        ? `No price levels match "${params.search}".`
                        : 'No price levels yet.'}
                    </p>
                    {!params.search && (
                      <button
                        onClick={() => navigate({ to: '/price-levels/create' })}
                        className="text-sm text-primary hover:underline"
                      >
                        Create your first price level
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {(data.page - 1) * data.limit + 1}-{Math.min(data.page * data.limit, data.total)} of{' '}
              {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setParams((p) => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))}
                disabled={(params.page || 1) <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - (data.page || 1)) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400 text-xs">...</span>
                    )}
                    <button
                      onClick={() => setParams((prev) => ({ ...prev, page: p }))}
                      className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
                        (data.page || 1) === p
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setParams((p) => ({ ...p, page: Math.min(data.totalPages, (p.page || 1) + 1) }))}
                disabled={(params.page || 1) >= data.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete Price Level</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action can be undone later.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteTarget.id)
                  setDeleteTarget(null)
                }}
                className="h-9 px-4 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
