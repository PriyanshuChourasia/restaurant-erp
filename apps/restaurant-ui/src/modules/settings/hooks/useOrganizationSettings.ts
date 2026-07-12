import { useState, useEffect, useCallback } from 'react'
import { useOrganization, useUpdateOrganization } from './useOrganizationQueries'
import type { OrganizationSettings } from '../types/organization.types'

export interface OrganizationFormState {
  restaurantName: string
  tagline: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website: string
  gstin: string
  fssaiLicense: string
  currency: string
  currencySymbol: string
  timezone: string
  taxLabel: string
  defaultTaxRate: number
  serviceChargePercent: number
  invoiceFooter: string
}

const DEFAULT_FORM: OrganizationFormState = {
  restaurantName: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
  gstin: '',
  fssaiLicense: '',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  taxLabel: 'GST',
  defaultTaxRate: 0,
  serviceChargePercent: 0,
  invoiceFooter: '',
}

function mapToForm(org: OrganizationSettings): OrganizationFormState {
  return {
    restaurantName: org.restaurantName || DEFAULT_FORM.restaurantName,
    tagline: org.tagline || DEFAULT_FORM.tagline,
    address: org.address || DEFAULT_FORM.address,
    city: org.city || DEFAULT_FORM.city,
    state: org.state || DEFAULT_FORM.state,
    pincode: org.pincode || DEFAULT_FORM.pincode,
    phone: org.phone || DEFAULT_FORM.phone,
    email: org.email || DEFAULT_FORM.email,
    website: org.website || DEFAULT_FORM.website,
    gstin: org.gstin || DEFAULT_FORM.gstin,
    fssaiLicense: org.fssaiLicense || DEFAULT_FORM.fssaiLicense,
    currency: org.currency || DEFAULT_FORM.currency,
    currencySymbol: org.currencySymbol || DEFAULT_FORM.currencySymbol,
    timezone: org.timezone || DEFAULT_FORM.timezone,
    taxLabel: org.taxLabel || DEFAULT_FORM.taxLabel,
    defaultTaxRate: org.defaultTaxRate ?? DEFAULT_FORM.defaultTaxRate,
    serviceChargePercent: org.serviceChargePercent ?? DEFAULT_FORM.serviceChargePercent,
    invoiceFooter: org.invoiceFooter || DEFAULT_FORM.invoiceFooter,
  }
}

/**
 * Manages the organization settings form lifecycle.
 *
 * SOLID:
 * - Single Responsibility: OWNER of form state + save orchestration.
 * - Dependency Inversion: Hides API hook details; exposes simple imperative API.
 */
export function useOrganizationSettings() {
  const { data: org, isLoading, error } = useOrganization()
  const updateMutation = useUpdateOrganization()
  const [form, setForm] = useState<OrganizationFormState>(DEFAULT_FORM)
  const [saved, setSaved] = useState(false)

  // Sync API data → form when org loads
  useEffect(() => {
    if (org) {
      setForm(mapToForm(org))
    }
  }, [org])

  // Single change handler with strict typing
  const handleChange = useCallback(<K extends keyof OrganizationFormState>(
    key: K,
    value: OrganizationFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Save orchestration
  const handleSave = useCallback(async () => {
    setSaved(false)
    await updateMutation.mutateAsync(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [form, updateMutation])

  // Coerce numeric string → number for numeric fields
  const handleNumericChange = useCallback((key: 'defaultTaxRate' | 'serviceChargePercent', raw: string) => {
    const num = parseFloat(raw)
    handleChange(key, isNaN(num) ? 0 : num)
  }, [handleChange])

  return {
    form,
    saved,
    isLoading,
    isSaving: updateMutation.isPending,
    error,
    handleChange,
    handleNumericChange,
    handleSave,
  }
}
