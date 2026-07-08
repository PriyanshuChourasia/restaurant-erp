import { createFileRoute } from '@tanstack/react-router'
import { InventoryPage } from '../modules/inventory/pages/InventoryPage'

export const Route = createFileRoute('/inventory')({
  component: InventoryPage,
})
