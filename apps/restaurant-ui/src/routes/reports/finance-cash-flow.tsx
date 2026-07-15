import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/finance-cash-flow')({
  component: () => <ConfigReportPage reportId="finance-cash-flow" />,
})
