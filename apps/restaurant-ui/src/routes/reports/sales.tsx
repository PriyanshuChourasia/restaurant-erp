import { createFileRoute } from '@tanstack/react-router'
import { SalesSummaryPage } from '../../modules/reports/pages/SalesSummaryPage'

export const Route = createFileRoute('/reports/sales')({
  component: SalesSummaryPage,
})
