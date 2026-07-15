import { createFileRoute } from '@tanstack/react-router'
import { StockMovementPage } from '../../modules/reports/pages/StockMovementPage'

export const Route = createFileRoute('/reports/inventory-movements')({
  component: StockMovementPage,
})
