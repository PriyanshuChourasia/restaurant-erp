import { createFileRoute } from '@tanstack/react-router'
import { EditCategoryPage } from '../modules/category/pages/EditCategoryPage'

export const Route = createFileRoute('/categories_/$id_/edit')({
  component: function EditCategoryRoute() {
    const { id } = Route.useParams()
    return <EditCategoryPage categoryId={id} />
  },
})
