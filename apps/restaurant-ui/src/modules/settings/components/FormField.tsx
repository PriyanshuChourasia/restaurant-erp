import type { LucideIcon } from 'lucide-react'

// ─── Shared prop interface ──────────────────────────────────────────
// Interface Segregation: Each field type only receives the props it needs.
// Liskov Substitution: All field types share this common interface shape.

interface BaseFieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  icon?: LucideIcon
  placeholder?: string
  error?: string
}

// ─── Text / Email / Tel ────────────────────────────────────────────

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel'
}

export function FormField({
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  error,
}: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={14} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-9 rounded-lg border ${error ? 'border-red-300' : 'border-gray-300'} bg-white px-3 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10 w-full ${Icon ? 'pl-8' : ''}`}
        />
      </div>
    </FieldWrapper>
  )
}

// ─── Number ─────────────────────────────────────────────────────────

interface NumberFieldProps extends BaseFieldProps {
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  label,
  value,
  onChange,
  icon: Icon,
  min,
  max,
  step,
  placeholder,
  error,
}: NumberFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={14} />
          </div>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className={`h-9 rounded-lg border ${error ? 'border-red-300' : 'border-gray-300'} bg-white px-3 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10 w-full ${Icon ? 'pl-8' : ''}`}
        />
      </div>
    </FieldWrapper>
  )
}

// ─── TextArea ───────────────────────────────────────────────────────

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
}: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-lg border ${error ? 'border-red-300' : 'border-gray-300'} bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10 resize-none`}
      />
    </FieldWrapper>
  )
}

// ─── FieldWrapper (internal) ────────────────────────────────────────

function FieldWrapper({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
