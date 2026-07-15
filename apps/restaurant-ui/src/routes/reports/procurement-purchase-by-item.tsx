import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/procurement-purchase-by-item')({
  component: () => <ConfigReportPage reportId="procurement-purchase-by-item" />,
})
