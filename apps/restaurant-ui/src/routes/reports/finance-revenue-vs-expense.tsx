import { createFileRoute } from '@tanstack/react-router'
import { RevenueVsExpensePage } from '../../modules/reports/pages/RevenueVsExpensePage'

export const Route = createFileRoute('/reports/finance-revenue-vs-expense')({
  component: RevenueVsExpensePage,
})
