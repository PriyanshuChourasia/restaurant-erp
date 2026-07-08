import { createFileRoute } from '@tanstack/react-router'
import { CreateCategoryPage } from '../modules/category/pages/CreateCategoryPage'

export const Route = createFileRoute('/categories_/create')({
  component: CreateCategoryPage,
})
