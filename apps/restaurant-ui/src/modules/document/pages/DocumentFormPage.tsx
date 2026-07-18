import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Save, Upload } from 'lucide-react'
import { useDocument, useCreateDocument, useUploadDocument, useUpdateDocument } from '../hooks/useDocumentQueries'
import {
  createDocumentSchema,
  type CreateDocumentFormValues,
} from '../schemas/document.schema'
import { DocumentType, DocumentStatus } from '../types/document.types'
import { FileUpload } from '../components/FileUpload'

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: DocumentType.INVOICE, label: 'Invoice' },
  { value: DocumentType.RECEIPT, label: 'Receipt' },
  { value: DocumentType.PURCHASE_ORDER, label: 'Purchase Order' },
  { value: DocumentType.DELIVERY_NOTE, label: 'Delivery Note' },
  { value: DocumentType.QUOTATION, label: 'Quotation' },
  { value: DocumentType.CONTRACT, label: 'Contract' },
  { value: DocumentType.LICENSE, label: 'License' },
  { value: DocumentType.CERTIFICATE, label: 'Certificate' },
  { value: DocumentType.OTHER, label: 'Other' },
]

const DOCUMENT_STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: DocumentStatus.DRAFT, label: 'Draft' },
  { value: DocumentStatus.PENDING, label: 'Pending' },
  { value: DocumentStatus.APPROVED, label: 'Approved' },
  { value: DocumentStatus.REJECTED, label: 'Rejected' },
  { value: DocumentStatus.ARCHIVED, label: 'Archived' },
]

const defaultValues: CreateDocumentFormValues = {
  title: '',
  type: DocumentType.OTHER as any,
  status: DocumentStatus.DRAFT as any,
  description: '',
  fileName: '',
  filePath: '',
  mimeType: '',
  linkedEntityType: '',
  linkedEntityId: '',
  documentDate: '',
  expiryDate: '',
  notes: '',
}

interface DocumentFormPageProps {
  documentId?: string
  defaultEntityType?: string
  defaultEntityId?: string
}

export function DocumentFormPage({ documentId, defaultEntityType, defaultEntityId }: DocumentFormPageProps) {
  const navigate = useNavigate()
  const isEdit = !!documentId

  const { data: existingDoc, isLoading: isLoadingDoc } = useDocument(documentId || '')

  const [form, setForm] = useState<CreateDocumentFormValues>({
    ...defaultValues,
    linkedEntityType: defaultEntityType || '',
    linkedEntityId: defaultEntityId || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const createMutation = useCreateDocument()
  const uploadMutation = useUploadDocument()
  const updateMutation = useUpdateDocument()

  useEffect(() => {
    if (isEdit && existingDoc) {
      setForm({
        title: existingDoc.title,
        type: existingDoc.type,
        status: existingDoc.status,
        description: existingDoc.description || '',
        fileName: existingDoc.fileName || '',
        filePath: existingDoc.filePath || '',
        mimeType: existingDoc.mimeType || '',
        linkedEntityType: existingDoc.linkedEntityType || '',
        linkedEntityId: existingDoc.linkedEntityId || '',
        documentDate: existingDoc.documentDate || '',
        expiryDate: existingDoc.expiryDate || '',
        notes: existingDoc.notes || '',
      })
    }
  }, [isEdit, existingDoc])

  const handleChange = (field: keyof CreateDocumentFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = createDocumentSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    const payload = {
      ...result.data,
      type: result.data.type as DocumentType,
      status: result.data.status as DocumentStatus,
      description: result.data.description || undefined,
      fileName: result.data.fileName || undefined,
      filePath: result.data.filePath || undefined,
      mimeType: result.data.mimeType || undefined,
      linkedEntityType: result.data.linkedEntityType || undefined,
      linkedEntityId: result.data.linkedEntityId || undefined,
      documentDate: result.data.documentDate || undefined,
      expiryDate: result.data.expiryDate || undefined,
      notes: result.data.notes || undefined,
    }

    try {
      if (isEdit && documentId) {
        await updateMutation.mutateAsync({ id: documentId, payload })
      } else if (selectedFile) {
        await uploadMutation.mutateAsync({ file: selectedFile, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate({ to: '/documents' })
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (typeof msg === 'string') {
        setErrors({ submit: msg })
      } else if (Array.isArray(msg)) {
        setErrors({ submit: msg[0] })
      } else {
        setErrors({ submit: isEdit ? 'Failed to update document' : 'Failed to create document' })
      }
    }
  }

  if (isEdit && isLoadingDoc) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    )
  }

  const isPending = createMutation.isPending || uploadMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/documents' })}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Edit Document' : 'Add Document'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? 'Update document details' : 'Upload a new document'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        {/* File Upload */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Upload File <span className="text-red-400">*</span>
            </label>
            <FileUpload
              onFileSelect={setSelectedFile}
              onFileRemove={() => setSelectedFile(null)}
              selectedFile={selectedFile}
              disabled={isPending}
              isUploading={uploadMutation.isPending}
            />
          </div>
        )}

        {/* Title */}
        <Field
          label="Title"
          value={form.title}
          onChange={(v) => handleChange('title', v)}
          error={errors.title}
          placeholder="Document title"
          required
        />

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Type"
            value={form.type}
            onChange={(v) => handleChange('type', v)}
            options={DOCUMENT_TYPE_OPTIONS}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => handleChange('status', v)}
            options={DOCUMENT_STATUS_OPTIONS}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
          />
        </div>

        {/* Linking */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Link to Entity (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Entity Type"
              value={form.linkedEntityType || ''}
              onChange={(v) => handleChange('linkedEntityType', v)}
              error={errors.linkedEntityType}
              placeholder="e.g. user, organization"
            />
            <Field
              label="Entity ID"
              value={form.linkedEntityId || ''}
              onChange={(v) => handleChange('linkedEntityId', v)}
              error={errors.linkedEntityId}
              placeholder="UUID"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Document Date"
              type="date"
              value={form.documentDate || ''}
              onChange={(v) => handleChange('documentDate', v)}
              error={errors.documentDate}
            />
            <Field
              label="Expiry Date"
              type="date"
              value={form.expiryDate || ''}
              onChange={(v) => handleChange('expiryDate', v)}
              error={errors.expiryDate}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-100 pt-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            />
          </div>
        </div>

        {/* Error */}
        {errors.submit && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.submit}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate({ to: '/documents' })}
            className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 h-10 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {selectedFile ? <Upload size={14} /> : <Save size={14} />}
            {isEdit ? 'Update' : selectedFile ? 'Upload' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
        }`}
      />
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
