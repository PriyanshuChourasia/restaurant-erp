import { createFileRoute } from '@tanstack/react-router'
import { StockCountPage } from '../../modules/inventory/pages/StockCountPage'

export const Route = createFileRoute('/inventory/stock-counts')({
  component: StockCountPage,
})
