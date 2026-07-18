export interface Document {
  id: string
  documentNumber: string
  title: string
  type: DocumentType
  status: DocumentStatus
  description: string | null
  fileName: string | null
  filePath: string | null
  mimeType: string | null
  fileSize: number | null
  linkedEntityType: string | null
  linkedEntityId: string | null
  createdBy: string | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
  documentDate: string | null
  expiryDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PURCHASE_ORDER = 'purchase_order',
  DELIVERY_NOTE = 'delivery_note',
  QUOTATION = 'quotation',
  CONTRACT = 'contract',
  LICENSE = 'license',
  CERTIFICATE = 'certificate',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export interface PaginatedDocumentResponse {
  items: Document[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DocumentListParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  status?: string
  linkedEntityType?: string
}

export interface CreateDocumentRequest {
  title: string
  type?: DocumentType
  status?: DocumentStatus
  description?: string
  fileName?: string
  filePath?: string
  mimeType?: string
  linkedEntityType?: string
  linkedEntityId?: string
  documentDate?: string
  expiryDate?: string
  notes?: string
}

export interface UpdateDocumentRequest extends Partial<CreateDocumentRequest> {}
