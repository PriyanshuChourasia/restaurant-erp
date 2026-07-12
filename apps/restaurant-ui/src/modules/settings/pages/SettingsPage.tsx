import {
  Store, Globe, MapPin, Phone, Mail, FileText, Hash,
  IndianRupee, DollarSign, Clock,
} from 'lucide-react'

import { useOrganizationSettings } from '../hooks/useOrganizationSettings'
import { PageHeader } from '../components/PageHeader'
import { SettingsSection } from '../components/SettingsSection'
import { FormField, NumberField, TextAreaField } from '../components/FormField'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { SuccessToast } from '../components/SuccessToast'

/**
 * Settings page — pure composition layer.
 *
 * SOLID applied:
 * - Single Responsibility: ONLY composes child components; no state, no API.
 * - Open/Closed: New sections can be added without modifying existing ones.
 * - Dependency Inversion: All data/logic injected via the hook; UI is a pure render tree.
 */
export function SettingsPage() {
  const {
    form,
    saved,
    isLoading,
    isSaving,
    error,
    handleChange,
    handleNumericChange,
    handleSave,
  } = useOrganizationSettings()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message="Failed to load settings. Make sure the server is running." />

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Company Settings"
        subtitle="Manage your restaurant's profile and preferences."
        isSaving={isSaving}
        onSave={handleSave}
      />

      {saved && <SuccessToast message="Settings saved successfully!" />}

      <div className="space-y-6">
        {/* ── Restaurant Info ─────────────────────────────────── */}
        <SettingsSection icon={Store} title="Restaurant Info">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Restaurant Name" value={form.restaurantName} onChange={(v) => handleChange('restaurantName', v)} icon={Store} />
            <FormField label="Tagline" value={form.tagline} onChange={(v) => handleChange('tagline', v)} />
            <div className="col-span-2">
              <FormField label="Address" value={form.address} onChange={(v) => handleChange('address', v)} icon={MapPin} />
            </div>
            <FormField label="City" value={form.city} onChange={(v) => handleChange('city', v)} />
            <FormField label="State" value={form.state} onChange={(v) => handleChange('state', v)} />
            <FormField label="Pincode" value={form.pincode} onChange={(v) => handleChange('pincode', v)} />
            <FormField label="Phone" value={form.phone} onChange={(v) => handleChange('phone', v)} icon={Phone} />
            <FormField label="Email" value={form.email} onChange={(v) => handleChange('email', v)} icon={Mail} />
            <FormField label="Website" value={form.website} onChange={(v) => handleChange('website', v)} icon={Globe} />
          </div>
        </SettingsSection>

        {/* ── Tax & License ───────────────────────────────────── */}
        <SettingsSection icon={FileText} title="Tax & License">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="GSTIN" value={form.gstin} onChange={(v) => handleChange('gstin', v)} icon={Hash} />
            <FormField label="FSSAI License" value={form.fssaiLicense} onChange={(v) => handleChange('fssaiLicense', v)} />
            <FormField label="Tax Label (e.g. GST, VAT)" value={form.taxLabel} onChange={(v) => handleChange('taxLabel', v)} />
            <NumberField label="Default Tax Rate (%)" value={form.defaultTaxRate} onChange={(v) => handleNumericChange('defaultTaxRate', v)} min={0} max={100} step={0.01} />
            <NumberField label="Service Charge (%)" value={form.serviceChargePercent} onChange={(v) => handleNumericChange('serviceChargePercent', v)} min={0} max={100} step={0.01} />
          </div>
        </SettingsSection>

        {/* ── Currency & Regional ─────────────────────────────── */}
        <SettingsSection icon={IndianRupee} title="Currency & Regional">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Currency Code" value={form.currency} onChange={(v) => handleChange('currency', v)} icon={DollarSign} />
            <FormField label="Currency Symbol" value={form.currencySymbol} onChange={(v) => handleChange('currencySymbol', v)} icon={IndianRupee} />
            <FormField label="Timezone" value={form.timezone} onChange={(v) => handleChange('timezone', v)} icon={Clock} />
          </div>
        </SettingsSection>

        {/* ── Invoice Settings ────────────────────────────────── */}
        <SettingsSection icon={FileText} title="Invoice Settings">
          <TextAreaField
            label="Invoice Footer Message"
            value={form.invoiceFooter}
            onChange={(v) => handleChange('invoiceFooter', v)}
            rows={3}
            placeholder="Thank you! Please visit again."
          />
        </SettingsSection>
      </div>
    </div>
  )
}
