import axios from 'axios'
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

const BASE_URL = '/api/categories'

export async function getCategories(
  params: CategoryListParams = {},
): Promise<PaginatedResponse<CategoryResponse>> {
  const { data } = await axios.get<PaginatedResponse<CategoryResponse>>(BASE_URL, { params })
  return data
}

export async function getCategory(id: string): Promise<CategoryResponse> {
  const { data } = await axios.get<CategoryResponse>(`${BASE_URL}/${id}`)
  return data
}

export async function getCategoryTree(): Promise<TreeResponse> {
  const { data } = await axios.get<TreeResponse>(`${BASE_URL}/tree`)
  return data
}

export async function getCategoryRoots(
  params: CategoryListParams = {},
): Promise<PaginatedResponse<CategoryResponse>> {
  const { data } = await axios.get<PaginatedResponse<CategoryResponse>>(`${BASE_URL}/root`, {
    params,
  })
  return data
}

export async function getCategoryChildren(
  id: string,
): Promise<CategoryResponse[]> {
  const { data } = await axios.get<CategoryResponse[]>(`${BASE_URL}/${id}/children`)
  return data
}

export async function getCategoryDescendants(
  id: string,
): Promise<CategoryResponse[]> {
  const { data } = await axios.get<CategoryResponse[]>(`${BASE_URL}/${id}/descendants`)
  return data
}

export async function getCategoryAncestors(
  id: string,
): Promise<BreadcrumbItem[]> {
  const { data } = await axios.get<BreadcrumbItem[]>(`${BASE_URL}/${id}/ancestors`)
  return data
}

export async function getCategoryBreadcrumb(
  id: string,
): Promise<BreadcrumbResponse> {
  const { data } = await axios.get<BreadcrumbResponse>(`${BASE_URL}/${id}/breadcrumb`)
  return data
}

export async function createCategory(
  payload: CreateCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await axios.post<CategoryResponse>(BASE_URL, payload)
  return data
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await axios.put<CategoryResponse>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function deleteCategory(
  id: string,
  force?: boolean,
): Promise<void> {
  await axios.delete(`${BASE_URL}/${id}`, {
    params: force ? { force: 'true' } : undefined,
  })
}

export async function restoreCategory(id: string): Promise<CategoryResponse> {
  const { data } = await axios.patch<CategoryResponse>(`${BASE_URL}/${id}/restore`)
  return data
}

export async function moveCategory(
  id: string,
  payload: MoveCategoryRequest,
): Promise<CategoryResponse> {
  const { data } = await axios.patch<CategoryResponse>(
    `${BASE_URL}/${id}/move`,
    payload,
  )
  return data
}

export async function activateCategory(id: string): Promise<CategoryResponse> {
  const { data } = await axios.patch<CategoryResponse>(
    `${BASE_URL}/${id}/activate`,
  )
  return data
}

export async function deactivateCategory(
  id: string,
): Promise<CategoryResponse> {
  const { data } = await axios.patch<CategoryResponse>(
    `${BASE_URL}/${id}/deactivate`,
  )
  return data
}
