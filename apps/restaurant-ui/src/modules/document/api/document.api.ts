import { apiClient } from '@/lib/axios-client'
import type {
  Document,
  PaginatedDocumentResponse,
  DocumentListParams,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types/document.types'

const BASE_URL = '/documents'

export async function getDocuments(params?: DocumentListParams): Promise<PaginatedDocumentResponse> {
  const { data } = await apiClient.get<PaginatedDocumentResponse>(BASE_URL, { params })
  return data
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await apiClient.get<Document>(`${BASE_URL}/${id}`)
  return data
}

export async function getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]> {
  const { data } = await apiClient.get<Document[]>(`${BASE_URL}/entity/${entityType}/${entityId}`)
  return data
}

export async function createDocument(payload: CreateDocumentRequest): Promise<Document> {
  const { data } = await apiClient.post<Document>(BASE_URL, payload)
  return data
}

export async function uploadDocument(file: File, payload: CreateDocumentRequest): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)
  
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value))
    }
  })

  const { data } = await apiClient.post<Document>(`${BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateDocument(id: string, payload: UpdateDocumentRequest): Promise<Document> {
  const { data } = await apiClient.patch<Document>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

export async function restoreDocument(id: string): Promise<Document> {
  const { data } = await apiClient.post<Document>(`${BASE_URL}/${id}/restore`)
  return data
}

export async function linkDocumentToEntity(documentId: string, entityType: string, entityId: string): Promise<void> {
  await apiClient.post(`${BASE_URL}/${documentId}/link`, { entityType, entityId })
}

export async function unlinkDocumentFromEntity(documentId: string, entityType: string, entityId: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${documentId}/link`, { data: { entityType, entityId } })
}

export async function getDocumentCount(): Promise<number> {
  const { data } = await apiClient.get<number>(`${BASE_URL}/count`)
  return data
}

export function getFileUrl(filename: string): string {
  return `${apiClient.defaults.baseURL}${BASE_URL}/files/${filename}`
}
