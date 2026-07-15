import { createFileRoute } from '@tanstack/react-router'
import { StorageUnitsPage } from '../modules/inventory/pages/StorageUnitsPage'

export const Route = createFileRoute('/storage-units')({
  component: StorageUnitsPage,
})
