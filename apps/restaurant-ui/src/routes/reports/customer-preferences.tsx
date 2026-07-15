import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/customer-preferences')({
  component: () => <ConfigReportPage reportId="customer-preferences" />,
})
