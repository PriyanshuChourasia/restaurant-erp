import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/customer-lifetime-value')({
  component: () => <ConfigReportPage reportId="customer-lifetime-value" />,
})
