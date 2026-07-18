import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDocuments,
  getDocument,
  getDocumentsByEntity,
  createDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  restoreDocument,
  linkDocumentToEntity,
  unlinkDocumentFromEntity,
} from '../api/document.api'
import type { DocumentListParams, CreateDocumentRequest, UpdateDocumentRequest } from '../types/document.types'

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: DocumentListParams) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  entity: (entityType: string, entityId: string) => [...documentKeys.all, 'entity', entityType, entityId] as const,
}

export function useDocuments(params?: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
    enabled: !!id,
  })
}

export function useDocumentsByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: documentKeys.entity(entityType, entityId),
    queryFn: () => getDocumentsByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDocumentRequest) => createDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, payload }: { file: File; payload: CreateDocumentRequest }) =>
      uploadDocument(file, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentRequest }) =>
      updateDocument(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useLinkDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, entityType, entityId }: { documentId: string; entityType: string; entityId: string }) =>
      linkDocumentToEntity(documentId, entityType, entityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.entity(variables.entityType, variables.entityId) })
    },
  })
}

export function useUnlinkDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, entityType, entityId }: { documentId: string; entityType: string; entityId: string }) =>
      unlinkDocumentFromEntity(documentId, entityType, entityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.entity(variables.entityType, variables.entityId) })
    },
  })
}
