import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  Undo2,
  Loader2,
} from 'lucide-react'
import { useDocument, useDeleteDocument, useRestoreDocument } from '../hooks/useDocumentQueries'
import type { DocumentType, DocumentStatus } from '../types/document.types'

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

export function DocumentDetailPage() {
  const { id } = useParams({ from: '/documents/$id' })
  const navigate = useNavigate()

  const { data: doc, isLoading } = useDocument(id)
  const deleteMutation = useDeleteDocument()
  const restoreMutation = useRestoreDocument()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteMutation.mutateAsync(id)
      navigate({ to: '/documents' })
    }
  }

  const handleRestore = async () => {
    await restoreMutation.mutateAsync(id)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText size={48} className="mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-600">Document not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/documents' })}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>
            <p className="text-sm text-gray-500 font-mono">{doc.documentNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doc.deletedAt ? (
            <button
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Undo2 size={14} />
              Restore
            </button>
          ) : (
            <>
              <Link
                to={`/documents/$id/edit`}
                params={{ id: doc.id }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Edit size={14} />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        {/* Status & Type Badges */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              DOCUMENT_STATUS_COLORS[doc.status]
            }`}
          >
            {DOCUMENT_STATUS_LABELS[doc.status]}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700">
            {DOCUMENT_TYPE_LABELS[doc.type]}
          </span>
        </div>

        {/* Description */}
        {doc.description && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-700">{doc.description}</p>
          </div>
        )}

        {/* File Info */}
        {(doc.fileName || doc.filePath || doc.fileSize) && (
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              File Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {doc.fileName && (
                <InfoItem label="File Name" value={doc.fileName} />
              )}
              {doc.mimeType && (
                <InfoItem label="MIME Type" value={doc.mimeType} />
              )}
              {doc.fileSize && (
                <InfoItem label="File Size" value={formatFileSize(doc.fileSize)} />
              )}
              {doc.filePath && (
                <InfoItem label="File Path" value={doc.filePath} />
              )}
            </div>
          </div>
        )}

        {/* Linked Entity */}
        {(doc.linkedEntityType || doc.linkedEntityId) && (
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Linked Entity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {doc.linkedEntityType && (
                <InfoItem label="Entity Type" value={doc.linkedEntityType} />
              )}
              {doc.linkedEntityId && (
                <InfoItem label="Entity ID" value={doc.linkedEntityId} />
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            {doc.documentDate && (
              <InfoItem
                label="Document Date"
                value={doc.documentDate}
                icon={<Calendar size={14} className="text-gray-400" />}
              />
            )}
            {doc.expiryDate && (
              <InfoItem
                label="Expiry Date"
                value={doc.expiryDate}
                icon={<Calendar size={14} className="text-gray-400" />}
              />
            )}
            <InfoItem
              label="Created"
              value={new Date(doc.createdAt).toLocaleDateString()}
              icon={<Clock size={14} className="text-gray-400" />}
            />
            {doc.creator && (
              <InfoItem
                label="Created By"
                value={doc.creator.name}
                icon={<User size={14} className="text-gray-400" />}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-sm text-gray-900 font-mono truncate">{value}</p>
      </div>
    </div>
  )
}
