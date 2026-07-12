import { createFileRoute } from '@tanstack/react-router'
import { CategorySalesPage } from '../../modules/reports/pages/CategorySalesPage'

export const Route = createFileRoute('/reports/categories')({
  component: CategorySalesPage,
})
