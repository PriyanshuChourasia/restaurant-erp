import { Link } from '@tanstack/react-router'
import {
  FileText,
  Download,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useDocumentsByEntity, useUnlinkDocument } from '../hooks/useDocumentQueries'
import { getFileUrl } from '../api/document.api'
import type { Document, DocumentStatus } from '../types/document.types'

const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-blue-100 text-blue-700',
}

interface EntityDocumentsProps {
  entityType: string
  entityId: string
  entityName?: string
  onCreateNew?: () => void
}

export function EntityDocuments({ entityType, entityId, onCreateNew }: EntityDocumentsProps) {
  const { data: documents, isLoading } = useDocumentsByEntity(entityType, entityId)
  const unlinkMutation = useUnlinkDocument()

  const handleUnlink = async (documentId: string) => {
    if (window.confirm('Are you sure you want to remove this document from this entity?')) {
      await unlinkMutation.mutateAsync({ documentId, entityType, entityId })
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-700">Documents</h3>
          {documents && documents.length > 0 && (
            <span className="text-xs text-gray-400">({documents.length})</span>
          )}
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-violet-600 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {!documents || documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FileText size={32} className="mb-2 opacity-30" />
          <p className="text-sm text-gray-500">No documents attached</p>
          <p className="text-xs text-gray-400">
            Upload a document or link an existing one.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {documents.map((doc: Document) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      DOCUMENT_STATUS_COLORS[doc.status]
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">{doc.documentNumber}</span>
                  {doc.fileName && (
                    <>
                      <span>·</span>
                      <span>{doc.fileName}</span>
                    </>
                  )}
                  {doc.fileSize && (
                    <>
                      <span>·</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {doc.filePath && (
                  <a
                    href={getFileUrl(doc.filePath.split('/').pop() || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Download"
                  >
                    <Download size={13} />
                  </a>
                )}
                <Link
                  to={`/documents/$id`}
                  params={{ id: doc.id }}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  title="View"
                >
                  <ExternalLink size={13} />
                </Link>
                <button
                  onClick={() => handleUnlink(doc.id)}
                  disabled={unlinkMutation.isPending}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
