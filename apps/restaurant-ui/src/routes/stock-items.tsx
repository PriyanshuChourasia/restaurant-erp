import { createFileRoute } from '@tanstack/react-router'
import { StockItemsPage } from '../modules/stock-items/pages/StockItemsPage'

export const Route = createFileRoute('/stock-items')({
  component: StockItemsPage,
})
