import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCategories,
  getCategory,
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryChildren,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  moveCategory,
  activateCategory,
  deactivateCategory,
} from '../api/category.api'
import type {
  CategoryListParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
} from '../types/category.types'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  breadcrumb: (id: string) => [...categoryKeys.all, 'breadcrumb', id] as const,
  children: (id: string) => [...categoryKeys.all, 'children', id] as const,
}

// ---- Queries ----

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: () => getCategoryTree(),
  })
}

export function useCategoryBreadcrumb(id: string) {
  return useQuery({
    queryKey: categoryKeys.breadcrumb(id),
    queryFn: () => getCategoryBreadcrumb(id),
    enabled: !!id,
  })
}

export function useCategoryChildren(id: string) {
  return useQuery({
    queryKey: categoryKeys.children(id),
    queryFn: () => getCategoryChildren(id),
    enabled: !!id,
  })
}

// ---- Mutations ----

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      deleteCategory(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useRestoreCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useMoveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MoveCategoryRequest }) =>
      moveCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useActivateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() })
    },
  })
}
