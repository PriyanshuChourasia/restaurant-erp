import { createFileRoute } from '@tanstack/react-router'
import { CategoryDetailsPage } from '../modules/category/pages/CategoryDetailsPage'

export const Route = createFileRoute('/categories_/$id')({
  component: function CategoryDetailsRoute() {
    const { id } = Route.useParams()
    return <CategoryDetailsPage categoryId={id} />
  },
})
