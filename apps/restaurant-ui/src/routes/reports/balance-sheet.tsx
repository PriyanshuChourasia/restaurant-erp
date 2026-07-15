import { createFileRoute } from '@tanstack/react-router'
import { BalanceSheetPage } from '../../modules/reports/pages/BalanceSheetPage'

export const Route = createFileRoute('/reports/balance-sheet')({
  component: BalanceSheetPage,
})
