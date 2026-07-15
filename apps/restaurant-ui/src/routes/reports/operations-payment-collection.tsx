import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/operations-payment-collection')({
  component: () => <ConfigReportPage reportId="operations-payment-collection" />,
})
