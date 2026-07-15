import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/inventory-recipe-costs')({
  component: () => <ConfigReportPage reportId="inventory-recipe-costs" />,
})
