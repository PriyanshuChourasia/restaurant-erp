import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import { priceLevelFormSchema, type PriceLevelFormValues } from '../schemas/price-level.schema'
import { useCreatePriceLevel, useUpdatePriceLevel, usePriceLevel } from '../hooks/usePriceLevelQueries'

interface PriceLevelFormPageProps {
  priceLevelId?: string
}

export function PriceLevelFormPage({ priceLevelId }: PriceLevelFormPageProps) {
  const navigate = useNavigate()
  const isEdit = !!priceLevelId
  const { data: priceLevel, isLoading: loadingPriceLevel } = usePriceLevel(priceLevelId || '')
  const createMutation = useCreatePriceLevel()
  const updateMutation = useUpdatePriceLevel()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PriceLevelFormValues>({
    resolver: zodResolver(priceLevelFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      isActive: true,
      isDefault: false,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (priceLevel) {
      reset({
        name: priceLevel.name,
        code: priceLevel.code,
        description: priceLevel.description || '',
        isActive: priceLevel.isActive,
        isDefault: priceLevel.isDefault,
      })
    }
  }, [priceLevel, reset])

  const onSubmit = async (values: PriceLevelFormValues) => {
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
      }

      if (isEdit && priceLevelId) {
        await updateMutation.mutateAsync({ id: priceLevelId, payload })
      } else {
        const createPayload = {
          name: values.name,
          code: values.code,
          description: values.description || undefined,
          isDefault: values.isDefault,
          isActive: values.isActive,
        }
        await createMutation.mutateAsync(createPayload)
      }
      navigate({ to: '/price-levels' })
    } catch {
      // Error handled by mutation
    }
  }

  if (isEdit && loadingPriceLevel) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/price-levels' })}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Price Level' : 'Create Price Level'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? 'Update the price level details.'
              : 'Define a new pricing tier for customer segments.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Standard, Corporate, Staff"
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              {...register('code')}
              placeholder="e.g. standard, corporate, staff"
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Lowercase alphanumeric and hyphens only. Used as a unique identifier.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Optional description..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-8 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-400">Can be used for billing</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isDefault')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Default</p>
                <p className="text-xs text-gray-400">Fallback for walk-in customers</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/price-levels' })}
            className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
