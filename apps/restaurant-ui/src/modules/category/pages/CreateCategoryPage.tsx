import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '../forms/CategoryForm'
import { useCreateCategory, useCategoryTree } from '../hooks/useCategoryQueries'
import { CardLoadingState } from '../components/LoadingState'
import type { CategoryFormValues } from '../schemas/category.schema'

export function CreateCategoryPage() {
  const navigate = useNavigate()
  const { data: treeData, isLoading: treeLoading } = useCategoryTree()
  const createMutation = useCreateCategory()

  const handleSubmit = async (values: CategoryFormValues) => {
    await createMutation.mutateAsync({
      name: values.name,
      slug: values.slug,
      description: values.description ?? undefined,
      displayOrder: values.displayOrder ?? 0,
      isActive: values.isActive ?? true,
      parentId: values.parentId ?? undefined,
      icon: values.icon ?? undefined,
      image: values.image ?? undefined,
    })
    navigate({ to: '/categories' })
  }

  if (treeLoading) {
    return <CardLoadingState />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate({ to: '/categories' })}>
          <ChevronLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Category</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new category to organize your content hierarchy.
          </p>
        </div>
      </div>

      {/* Form */}
      <CategoryForm
        tree={treeData?.items || []}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: '/categories' })}
        mode="create"
      />
    </div>
  )
}
