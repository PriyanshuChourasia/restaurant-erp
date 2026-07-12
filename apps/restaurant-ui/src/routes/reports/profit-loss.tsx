import { createFileRoute } from '@tanstack/react-router'
import { ProfitLossPage } from '../../modules/reports/pages/ProfitLossPage'

export const Route = createFileRoute('/reports/profit-loss')({
  component: ProfitLossPage,
})
