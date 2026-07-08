import { createFileRoute } from '@tanstack/react-router'
import { CategoryTreePage } from '../modules/category/pages/CategoryTreePage'

export const Route = createFileRoute('/categories_/tree')({
  component: CategoryTreePage,
})
