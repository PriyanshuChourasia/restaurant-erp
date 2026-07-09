import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
  type Updater,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  emptyMessage?: string
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
}

export function DataTable<TData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  emptyMessage = 'No data found.',
  sorting,
  onSortingChange,
}: DataTableProps<TData>) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.max(0, Math.min(page - 1, pageCount - 1))

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<unknown, unknown>[],
    pageCount,
    state: {
      pagination: { pageIndex: safePage, pageSize },
      ...(sorting ? { sorting } : {}),
    },
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const newState = typeof updater === 'function'
        ? updater({ pageIndex: safePage, pageSize })
        : updater
      onPageChange(newState.pageIndex + 1)
    },
    onSortingChange: onSortingChange,
    manualPagination: true,
    ...(onSortingChange ? { manualSorting: true } : {}),
    getCoreRowModel: getCoreRowModel(),
  })

  // Generate page numbers for display
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    const totalP = pageCount

    if (totalP <= 7) {
      for (let i = 1; i <= totalP; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('ellipsis')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalP - 1, page + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (page < totalP - 2) pages.push('ellipsis')
      pages.push(totalP)
    }
    return pages
  }, [pageCount, page])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-100 bg-gray-50/50">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                        canSort ? 'cursor-pointer select-none hover:text-gray-700' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <span className="inline-flex">
                            {sorted === 'asc' ? (
                              <ChevronUp size={13} className="text-primary" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown size={13} className="text-primary" />
                            ) : (
                              <ChevronsUpDown size={13} className="text-gray-300" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50" role="navigation" aria-label="Table pagination">
          <p className="text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{from}</span>-
            <span className="font-medium text-gray-700">{to}</span> of{' '}
            <span className="font-medium text-gray-700">{total}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {pageNumbers.map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
