import { apiClient } from '@/lib/axios-client'
import type {
  CategoryResponse,
  TreeResponse,
  BreadcrumbItem,
  BreadcrumbResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
  CategoryListParams,
  PaginatedResponse,
} from '../types/category.types'

const BASE_URL = '/categories'

export async function getCategories(
  params: CategoryListParams = {},
): Promise<PaginatedResponse<CategoryResponse>> {
  const { data } = await apiClient.get<PaginatedResponse<CategoryResponse>>(BASE_URL, { params })
  return data
}

export async function getCategory(id: string): Promise<CategoryResponse> {
  const { data } = await apiClient.get<CategoryResponse>(`${BASE_URL}/${id}`)
  return data
}

export async function getCategoryTree(): Promise<TreeResponse> {
  const { data } = await apiClient.get<TreeResponse>(`${BASE_URL}/tree`)
  return data
}

export async function getCategoryRoots(
  params: CategoryListParams = {},
): Promise<PaginatedResponse<CategoryResponse>> {
  const { data } = await apiClient.get<PaginatedResponse<CategoryResponse>>(`${BASE_URL}/root`, {
    params,
  })
  return data
}

export async function getCategoryChildren(
  id: string,
): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>(`${BASE_URL}/${id}/children`)
  return data
}

export async function getCategoryDescendants(
  id: string,
): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>(`${BASE_URL}/${id}/descendants`)
  return data
}

export async function getCategoryAncestors(
  id: string,
): Promise<BreadcrumbItem[]> {
  const { data } = await apiClient.get<BreadcrumbItem[]>(`${BASE_URL}/${id}/ancestors`)
  return data
}

export async function getCategoryBreadcrumb(
  id: string,
): Promise<BreadcrumbResponse> {
  const { data } = await apiClient.get<BreadcrumbResponse>(`${BASE_URL}/${id}/breadcrumb`)
  return data
}

export async function createCategory(
  payload: CreateCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await apiClient.post<CategoryResponse>(BASE_URL, payload)
  return data
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await apiClient.put<CategoryResponse>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function deleteCategory(
  id: string,
  force?: boolean,
): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`, {
    params: force ? { force: 'true' } : undefined,
  })
}

export async function restoreCategory(id: string): Promise<CategoryResponse> {
  const { data } = await apiClient.patch<CategoryResponse>(`${BASE_URL}/${id}/restore`)
  return data
}

export async function moveCategory(
  id: string,
  payload: MoveCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await apiClient.patch<CategoryResponse>(
    `${BASE_URL}/${id}/move`,
    payload,
  )
  return data
}

export async function activateCategory(id: string): Promise<CategoryResponse> {
  const { data } = await apiClient.patch<CategoryResponse>(
    `${BASE_URL}/${id}/activate`,
  )
  return data
}

export async function deactivateCategory(
  id: string,
): Promise<CategoryResponse> {
  const { data } = await apiClient.patch<CategoryResponse>(
    `${BASE_URL}/${id}/deactivate`,
  )
  return data
}
