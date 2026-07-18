import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Undo2,
  RefreshCw,
  Eye,
  Edit,
} from 'lucide-react'
import {
  useDocuments,
  useDeleteDocument,
  useRestoreDocument,
} from '../hooks/useDocumentQueries'
import type { Document, DocumentType, DocumentStatus } from '../types/document.types'

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  purchase_order: 'Purchase Order',
  delivery_note: 'Delivery Note',
  quotation: 'Quotation',
  contract: 'Contract',
  license: 'License',
  certificate: 'Certificate',
  other: 'Other',
}

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
}

const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-blue-100 text-blue-700',
}

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  invoice: 'bg-blue-100 text-blue-700',
  receipt: 'bg-green-100 text-green-700',
  purchase_order: 'bg-purple-100 text-purple-700',
  delivery_note: 'bg-orange-100 text-orange-700',
  quotation: 'bg-cyan-100 text-cyan-700',
  contract: 'bg-indigo-100 text-indigo-700',
  license: 'bg-pink-100 text-pink-700',
  certificate: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
}

export function DocumentListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, refetch, isFetching } = useDocuments({
    page,
    limit: 20,
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const deleteMutation = useDeleteDocument()
  const restoreMutation = useRestoreDocument()

  const documents = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage business documents, invoices, contracts, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/documents/create"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-700"
          >
            <Plus size={15} />
            Add Document
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
        >
          <option value="">All Types</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
        >
          <option value="">All Statuses</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 rounded-xl border border-gray-200 bg-white">
          <FileText size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-600">No documents found</p>
          <p className="text-sm">
            {search || typeFilter || statusFilter
              ? 'Try adjusting your filters.'
              : 'Add your first document to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Document</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                    Size
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc: Document) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      doc.deletedAt ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                          <p className="text-xs text-gray-500 font-mono">{doc.documentNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          DOCUMENT_TYPE_COLORS[doc.type]
                        }`}
                      >
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          DOCUMENT_STATUS_COLORS[doc.status]
                        }`}
                      >
                        {DOCUMENT_STATUS_LABELS[doc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {doc.documentDate || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {doc.deletedAt ? (
                          <button
                            onClick={() => handleRestore(doc.id)}
                            className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Undo2 size={12} />
                            Restore
                          </button>
                        ) : (
                          <>
                            <Link
                              to={`/documents/$id`}
                              params={{ id: doc.id }}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <Eye size={13} />
                            </Link>
                            <Link
                              to={`/documents/$id/edit`}
                              params={{ id: doc.id }}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <Edit size={13} />
                            </Link>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * 20 + 1, total)}-{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
