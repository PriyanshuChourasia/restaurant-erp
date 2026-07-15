import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/inventory-valuation')({
  component: () => <ConfigReportPage reportId="inventory-valuation" />,
})
