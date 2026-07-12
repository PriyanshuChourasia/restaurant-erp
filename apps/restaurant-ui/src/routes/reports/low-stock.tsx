import { createFileRoute } from '@tanstack/react-router'
import { LowStockPage } from '../../modules/reports/pages/LowStockPage'

export const Route = createFileRoute('/reports/low-stock')({
  component: LowStockPage,
})
