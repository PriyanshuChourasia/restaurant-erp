import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/kitchen-performance')({
  component: () => <ConfigReportPage reportId="kitchen-performance" />,
})
