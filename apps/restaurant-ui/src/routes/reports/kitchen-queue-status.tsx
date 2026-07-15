import { createFileRoute } from '@tanstack/react-router'
import { KitchenQueueStatusPage } from '../../modules/reports/pages/KitchenQueueStatusPage'

export const Route = createFileRoute('/reports/kitchen-queue-status')({
  component: KitchenQueueStatusPage,
})
