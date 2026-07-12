import { apiClient } from '@/lib/axios-client'
import type { OrganizationSettings, UpdateOrganizationRequest } from '../types/organization.types'

const BASE_URL = '/organization'

export async function getOrganization(): Promise<OrganizationSettings> {
  const { data } = await apiClient.get<OrganizationSettings>(BASE_URL)
  return data
}

export async function updateOrganization(
  payload: UpdateOrganizationRequest,
): Promise<OrganizationSettings> {
  const { data } = await apiClient.put<OrganizationSettings>(BASE_URL, payload)
  return data
}
