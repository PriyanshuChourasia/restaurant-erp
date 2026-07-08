import { Save, Store, Globe, Bell, Shield, DollarSign, Clock, Printer } from 'lucide-react'
import '../../../styles/global.css'

const settingsSections = [
  {
    title: 'Restaurant Info',
    icon: Store,
    fields: [
      { label: 'Restaurant Name', value: 'Bella Napoli' },
      { label: 'Address', value: '123 Main Street, New York, NY 10001' },
      { label: 'Phone', value: '+1 (555) 000-0000' },
      { label: 'Email', value: 'contact@bellanapoli.com' },
    ],
  },
  {
    title: 'Business Hours',
    icon: Clock,
    fields: [
      { label: 'Monday - Friday', value: '11:00 AM - 10:00 PM' },
      { label: 'Saturday', value: '10:00 AM - 11:00 PM' },
      { label: 'Sunday', value: '10:00 AM - 9:00 PM' },
    ],
  },
  {
    title: 'Tax & Currency',
    icon: DollarSign,
    fields: [
      { label: 'Currency', value: 'USD ($)' },
      { label: 'Tax Rate', value: '8.875%' },
      { label: 'Service Charge', value: '0%' },
    ],
  },
]

export function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your restaurant's configuration and preferences.</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Quick settings toggles */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Online Orders', icon: Globe, color: 'success', enabled: true },
          { label: 'Push Notifications', icon: Bell, color: 'info', enabled: true },
          { label: 'Auto-Print Receipts', icon: Printer, color: 'warning', enabled: false },
          { label: 'Two-Factor Auth', icon: Shield, color: 'primary', enabled: true },
        ].map((setting) => (
          <div key={setting.label} className="stat-card" style={{ padding: '16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={`stat-icon ${setting.color}`} style={{ width: 36, height: 36 }}><setting.icon size={18} /></div>
                <div className="stat-info">
                  <div className="stat-label" style={{ marginBottom: 0 }}>{setting.label}</div>
                </div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: setting.enabled ? 'var(--color-primary)' : 'var(--color-gray-300)',
                position: 'relative', transition: 'background var(--transition-fast)',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 2,
                  left: setting.enabled ? 22 : 2,
                  transition: 'left var(--transition-fast)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="section-card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <section.icon size={18} style={{ color: 'var(--color-primary)' }} />
              {section.title}
            </div>
          </div>
          <div className="card-body">
            {section.fields.map((field) => (
              <div key={field.label} style={{
                display: 'flex', alignItems: 'center', padding: '12px 0',
                borderBottom: '1px solid var(--color-gray-100)',
              }}>
                <div style={{ width: 200, fontSize: 14, fontWeight: 500, color: 'var(--color-gray-600)' }}>
                  {field.label}
                </div>
                <input
                  type="text"
                  defaultValue={field.value}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid var(--color-gray-300)',
                    borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-gray-900)',
                    outline: 'none', transition: 'border-color var(--transition-fast)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-gray-300)'}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
