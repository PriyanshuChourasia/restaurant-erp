import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/procurement-reorder')({
  component: () => <ConfigReportPage reportId="procurement-reorder" />,
})
