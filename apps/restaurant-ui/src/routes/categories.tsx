import { createFileRoute } from '@tanstack/react-router'
import { CategoryListPage } from '../modules/category/pages/CategoryListPage'

export const Route = createFileRoute('/categories')({
  component: CategoryListPage,
})
