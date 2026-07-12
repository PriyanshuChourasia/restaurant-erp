import { createFileRoute } from '@tanstack/react-router'
import { PopularItemsPage } from '../../modules/reports/pages/PopularItemsPage'

export const Route = createFileRoute('/reports/popular-items')({
  component: PopularItemsPage,
})
