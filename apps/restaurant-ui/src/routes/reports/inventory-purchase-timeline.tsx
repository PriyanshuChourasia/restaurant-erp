import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/inventory-purchase-timeline')({
  component: () => <ConfigReportPage reportId="inventory-purchase-timeline" />,
})
