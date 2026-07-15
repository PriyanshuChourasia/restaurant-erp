import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/customer-walkin-vs-registered')({
  component: () => <ConfigReportPage reportId="customer-walkin-vs-registered" />,
})
