import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useCreateStaff } from '../hooks/useStaffQueries'
import { getRoles } from '../api/staff.api'
import { createStaffSchema, type CreateStaffFormValues } from '../schemas/staff.schema'

interface AddStaffDialogProps {
  open: boolean
  onClose: () => void
}

const defaultValues: CreateStaffFormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  roleId: '',
}

export function AddStaffDialog({ open, onClose }: AddStaffDialogProps) {
  const [form, setForm] = useState<CreateStaffFormValues>(defaultValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createMutation = useCreateStaff()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: open,
  })

  if (!open) return null

  const handleChange = (field: keyof CreateStaffFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = createStaffSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    const payload = {
      ...result.data,
      phone: result.data.phone || undefined,
    }

    try {
      await createMutation.mutateAsync(payload)
      setForm(defaultValues)
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (typeof msg === 'string') {
        setErrors({ submit: msg })
      } else if (Array.isArray(msg)) {
        setErrors({ submit: msg[0] })
      } else {
        setErrors({ submit: 'Failed to create staff member' })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => handleChange('name', v)}
            error={errors.name}
            placeholder="John Doe"
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
            error={errors.email}
            placeholder="john@example.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => handleChange('password', v)}
            error={errors.password}
            placeholder="Min 8 characters"
            required
          />
          <Field
            label="Phone"
            value={form.phone || ''}
            onChange={(v) => handleChange('phone', v)}
            error={errors.phone}
            placeholder="+1 234 567 890"
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={form.roleId}
              onChange={(e) => handleChange('roleId', e.target.value)}
              className={`h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors ${
                errors.roleId
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
              }`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && <p className="mt-0.5 text-[11px] text-red-500">{errors.roleId}</p>}
          </div>

          {errors.submit && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.submit}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-9 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
        }`}
      />
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
