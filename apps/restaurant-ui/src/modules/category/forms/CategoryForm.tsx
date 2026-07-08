import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categoryFormSchema, type CategoryFormValues } from '../schemas/category.schema'
import { ParentCategorySelector } from '../components/ParentCategorySelector'
import { SlugInput } from '../components/SlugInput'
import type { TreeCategory } from '../types/category.types'

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>
  tree: TreeCategory[]
  isSubmitting: boolean
  onSubmit: (values: CategoryFormValues) => Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit'
  excludeId?: string
}

export function CategoryForm({
  defaultValues,
  tree,
  isSubmitting,
  onSubmit,
  onCancel,
  mode,
  excludeId,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaultValues || {
      name: '',
      slug: '',
      description: null,
      parentId: null,
      displayOrder: 0,
      isActive: true,
      icon: null,
      image: null,
    },
    mode: 'onBlur',
  })

  const nameValue = watch('name')
  const slugValue = watch('slug')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'create'
              ? 'Add a new category to organize your content.'
              : 'Update the category details.'}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {/* Name & Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Category name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <SlugInput
              value={slugValue}
              onChange={(val) => setValue('slug', val, { shouldValidate: true })}
              nameValue={nameValue}
              error={errors.slug?.message}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Brief description of this category..."
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Parent & Display Order */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ParentCategorySelector
              tree={tree}
              value={watch('parentId')}
              onChange={(val) => setValue('parentId', val, { shouldValidate: true })}
              excludeId={excludeId}
              error={errors.parentId?.message}
            />

            <div className="space-y-1.5">
              <label htmlFor="displayOrder" className="text-sm font-medium text-foreground">
                Display Order
              </label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                {...register('displayOrder', { valueAsNumber: true })}
                placeholder="0"
                className={errors.displayOrder ? 'border-destructive' : ''}
              />
              {errors.displayOrder && (
                <p className="text-xs text-destructive">{errors.displayOrder.message}</p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                {...register('isActive')}
              />
              <div className="h-6 w-10 rounded-full border border-input bg-muted after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-4" />
            </label>
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive categories will be hidden from selection.
              </p>
            </div>
          </div>

          {/* Icon & Image */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="icon" className="text-sm font-medium text-foreground">
                Icon (URL)
              </label>
              <Input
                id="icon"
                {...register('icon')}
                placeholder="https://example.com/icon.svg"
                className={errors.icon ? 'border-destructive' : ''}
              />
              {errors.icon && (
                <p className="text-xs text-destructive">{errors.icon.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="image" className="text-sm font-medium text-foreground">
                Image (URL)
              </label>
              <Input
                id="image"
                {...register('image')}
                placeholder="https://example.com/image.jpg"
                className={errors.image ? 'border-destructive' : ''}
              />
              {errors.image && (
                <p className="text-xs text-destructive">{errors.image.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X size={14} />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Category'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
