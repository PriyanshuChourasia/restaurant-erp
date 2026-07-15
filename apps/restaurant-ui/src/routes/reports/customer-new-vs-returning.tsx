import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/customer-new-vs-returning')({
  component: () => <ConfigReportPage reportId="customer-new-vs-returning" />,
})
