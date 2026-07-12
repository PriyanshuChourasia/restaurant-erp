export interface OrganizationSettings {
  id: string
  restaurantName: string
  tagline: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
  website: string | null
  gstin: string | null
  fssaiLicense: string | null
  currency: string
  currencySymbol: string
  timezone: string
  taxLabel: string
  defaultTaxRate: number
  serviceChargePercent: number
  businessHours: Record<string, { open: string; close: string; isClosed: boolean }> | null
  invoiceFooter: string | null
  isActive: boolean
}

export type UpdateOrganizationRequest = Partial<OrganizationSettings>
