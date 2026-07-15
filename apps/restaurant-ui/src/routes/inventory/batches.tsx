import { createFileRoute } from '@tanstack/react-router'
import { BatchesPage } from '../../modules/inventory/pages/BatchesPage'

export const Route = createFileRoute('/inventory/batches')({
  component: BatchesPage,
})
