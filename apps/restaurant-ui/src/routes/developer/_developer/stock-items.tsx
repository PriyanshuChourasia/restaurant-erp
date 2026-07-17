import { createFileRoute } from '@tanstack/react-router'
import { DeveloperStockItemsPage } from '@/modules/developer/pages/developer-stock-items-page'

export const Route = createFileRoute('/developer/_developer/stock-items')({
  component: DeveloperStockItemsPage,
})
