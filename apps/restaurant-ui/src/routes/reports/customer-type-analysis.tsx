import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/customer-type-analysis')({
  component: () => <ConfigReportPage reportId="customer-type-analysis" />,
})
