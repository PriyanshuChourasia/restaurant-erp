import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/inventory-reconciliation')({
  component: () => <ConfigReportPage reportId="inventory-reconciliation" />,
})
