import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '../forms/CategoryForm'
import {
  useCategory,
  useUpdateCategory,
  useCategoryTree,
} from '../hooks/useCategoryQueries'
import { CardLoadingState } from '../components/LoadingState'
import type { CategoryFormValues } from '../schemas/category.schema'

interface EditCategoryPageProps {
  categoryId: string
}

export function EditCategoryPage({ categoryId }: EditCategoryPageProps) {
  const navigate = useNavigate()
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId)
  const { data: treeData, isLoading: treeLoading } = useCategoryTree()
  const updateMutation = useUpdateCategory()

  const isLoading = categoryLoading || treeLoading

  const handleSubmit = async (values: CategoryFormValues) => {
    await updateMutation.mutateAsync({
      id: categoryId,
      payload: {
        name: values.name,
        slug: values.slug,
        description: values.description ?? undefined,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
        icon: values.icon ?? undefined,
        image: values.image ?? undefined,
      },
    })
    navigate({ to: '/categories' })
  }

  if (isLoading) {
    return <CardLoadingState />
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Category not found</p>
        <Button
          variant="link"
          onClick={() => navigate({ to: '/categories' })}
          className="mt-2"
        >
          Back to categories
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate({ to: '/categories' })}>
          <ChevronLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Category</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update details for "{category.name}".
          </p>
        </div>
      </div>

      {/* Form */}
      <CategoryForm
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: category.parentId,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          icon: category.icon,
          image: category.image,
        }}
        tree={treeData?.items || []}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: '/categories' })}
        mode="edit"
        excludeId={categoryId}
      />
    </div>
  )
}
