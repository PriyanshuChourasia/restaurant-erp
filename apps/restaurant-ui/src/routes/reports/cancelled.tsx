import { createFileRoute } from '@tanstack/react-router'
import { CancelledTransactionsPage } from '../../modules/reports/pages/CancelledTransactionsPage'

export const Route = createFileRoute('/reports/cancelled')({
  component: CancelledTransactionsPage,
})
