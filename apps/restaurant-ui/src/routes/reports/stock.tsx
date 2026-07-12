import { createFileRoute } from '@tanstack/react-router'
import { StockStatusPage } from '../../modules/reports/pages/StockStatusPage'

export const Route = createFileRoute('/reports/stock')({
  component: StockStatusPage,
})
