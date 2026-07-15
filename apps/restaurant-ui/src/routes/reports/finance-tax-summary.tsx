import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/finance-tax-summary')({
  component: () => <ConfigReportPage reportId="finance-tax-summary" />,
})
